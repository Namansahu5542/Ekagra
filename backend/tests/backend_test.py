"""Backend API tests for CareCompanion AI (patient-app iteration).
Covers auth, patient profile, sync push/pull idempotency, patient PIN lockout,
and voice proxy validation. Uses public preview URL under /api/v1.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL"
) or "https://c6193a23-bceb-4cbb-a537-bd6e99f3e693.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api/v1"


def _uniq():
    return uuid.uuid4().hex[:8]


@pytest.fixture(scope="session")
def caregiver():
    """Signup a fresh caregiver, return {email, password, user_id, token}."""
    email = f"tester_{_uniq()}@example.com"
    password = "secret1"
    r = requests.post(f"{API}/auth/caregiver/signup", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    assert "user_id" in data and "token" in data
    return {"email": email, "password": password, **data}


@pytest.fixture(scope="session")
def patient(caregiver):
    """Create a patient profile as this caregiver, PIN 1234."""
    r = requests.post(
        f"{API}/patient-profile/create",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={
            "name": "Grandpa Test",
            "preferred_language": "en",
            "pin": "1234",
            "consent_confirmed": True,
        },
        timeout=15,
    )
    assert r.status_code == 200, f"profile create failed: {r.status_code} {r.text}"
    pid = r.json()["patient_id"]
    # Verify PIN to get a session token
    r2 = requests.post(f"{API}/auth/patient/verify-pin", json={"patient_id": pid, "pin": "1234"}, timeout=15)
    assert r2.status_code == 200, r2.text
    return {"patient_id": pid, "token": r2.json()["patient_session_token"]}


# ---------- Health ----------
def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["mongo"] is True


# ---------- Auth ----------
def test_caregiver_signup_and_login(caregiver):
    r = requests.post(
        f"{API}/auth/caregiver/login",
        json={"email": caregiver["email"], "password": caregiver["password"]},
        timeout=15,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["user_id"] == caregiver["user_id"]
    assert isinstance(body["token"], str) and len(body["token"]) > 20


def test_caregiver_signup_duplicate_conflict(caregiver):
    r = requests.post(
        f"{API}/auth/caregiver/signup",
        json={"email": caregiver["email"], "password": "secret1"},
        timeout=15,
    )
    assert r.status_code == 409


def test_caregiver_login_bad_password(caregiver):
    r = requests.post(
        f"{API}/auth/caregiver/login",
        json={"email": caregiver["email"], "password": "wrong-password"},
        timeout=15,
    )
    assert r.status_code == 401


# ---------- Patient profile ----------
def test_profile_requires_consent(caregiver):
    r = requests.post(
        f"{API}/patient-profile/create",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"name": "NoConsent", "preferred_language": "en", "pin": "1234", "consent_confirmed": False},
        timeout=15,
    )
    assert r.status_code == 422


def test_profile_get_as_caregiver_no_pin_hash(caregiver, patient):
    r = requests.get(
        f"{API}/patient-profile/{patient['patient_id']}/as-caregiver",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        timeout=15,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["patient_id"] == patient["patient_id"]
    assert "pin_hash" not in body


def test_profile_get_unlinked_caregiver_forbidden(patient):
    """A different caregiver (not linked) should get 403."""
    email = f"other_{_uniq()}@example.com"
    r = requests.post(f"{API}/auth/caregiver/signup", json={"email": email, "password": "secret1"}, timeout=15)
    tok = r.json()["token"]
    r2 = requests.get(
        f"{API}/patient-profile/{patient['patient_id']}/as-caregiver",
        headers={"Authorization": f"Bearer {tok}"},
        timeout=15,
    )
    assert r2.status_code == 403


# ---------- PIN verify + lockout ----------
def test_verify_pin_wrong_then_lockout(caregiver):
    # Fresh patient to isolate attempts counter
    r = requests.post(
        f"{API}/patient-profile/create",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"name": "LockoutPat", "preferred_language": "en", "pin": "1234", "consent_confirmed": True},
        timeout=15,
    )
    pid = r.json()["patient_id"]
    # 5 wrong attempts -> 401 each
    for i in range(5):
        rr = requests.post(f"{API}/auth/patient/verify-pin", json={"patient_id": pid, "pin": "0000"}, timeout=15)
        assert rr.status_code == 401, f"attempt {i}: {rr.status_code}"
    # 6th (or another) attempt should now be 429
    rr = requests.post(f"{API}/auth/patient/verify-pin", json={"patient_id": pid, "pin": "1234"}, timeout=15)
    assert rr.status_code == 429


# ---------- Sync push idempotency ----------
def test_sync_push_idempotent_and_pull(patient):
    session_id = str(uuid.uuid4())
    payload = {
        "game_sessions": [{
            "session_id": session_id,
            "patient_id": patient["patient_id"],
            "game_id": "flip_cards",
            "difficulty_level": 2,
            "score": 100.0,
            "accuracy": 1.0,
            "completion_time_ms": 12345,
            "hints_used": 0,
            "skipped_questions": 0,
            "quit_event": False,
            "frustration_signal": False,
            "played_at": "2026-01-15T10:00:00+00:00",
        }],
        "sticky_notes": [],
        "reminder_logs": [],
        "location_pings": [],
    }
    headers = {"X-Patient-PIN-Token": patient["token"]}
    r1 = requests.post(f"{API}/sync/push", json=payload, headers=headers, timeout=15)
    assert r1.status_code == 200, r1.text
    assert session_id in r1.json()["accepted_ids"]["game_sessions"]
    # Push again — should still succeed and NOT create duplicates
    r2 = requests.post(f"{API}/sync/push", json=payload, headers=headers, timeout=15)
    assert r2.status_code == 200
    assert session_id in r2.json()["accepted_ids"]["game_sessions"]

    # Pull returns profile + server_time
    rp = requests.get(
        f"{API}/sync/pull?patient_id={patient['patient_id']}",
        headers=headers,
        timeout=15,
    )
    assert rp.status_code == 200
    body = rp.json()
    assert "server_time" in body
    assert body.get("profile_updates") is not None
    assert "pin_hash" not in (body["profile_updates"] or {})


def test_sync_push_no_token_401(patient):
    r = requests.post(f"{API}/sync/push", json={"game_sessions": []}, timeout=10)
    assert r.status_code == 401


def test_sync_pull_wrong_patient_403(caregiver, patient):
    # Create a second patient, use its token to pull the first's data
    r = requests.post(
        f"{API}/patient-profile/create",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"name": "Other", "preferred_language": "en", "pin": "1234", "consent_confirmed": True},
        timeout=15,
    )
    other_pid = r.json()["patient_id"]
    r2 = requests.post(f"{API}/auth/patient/verify-pin", json={"patient_id": other_pid, "pin": "1234"}, timeout=15)
    other_tok = r2.json()["patient_session_token"]
    rp = requests.get(
        f"{API}/sync/pull?patient_id={patient['patient_id']}",
        headers={"X-Patient-PIN-Token": other_tok},
        timeout=15,
    )
    assert rp.status_code == 403


# ---------- Voice proxy validation ----------
def test_voice_tts_requires_patient_token():
    r = requests.post(f"{API}/voice/tts", json={"text": "hi", "target_language": "en-IN"}, timeout=15)
    assert r.status_code == 401


def test_voice_tts_rejects_assamese(patient):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "hello", "target_language": "as-IN"},
        headers={"X-Patient-PIN-Token": patient["token"]},
        timeout=15,
    )
    assert r.status_code == 422


def test_voice_tts_rejects_manipuri(patient):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "hello", "target_language": "mni-IN"},
        headers={"X-Patient-PIN-Token": patient["token"]},
        timeout=15,
    )
    assert r.status_code == 422


def test_voice_tts_accepts_supported_language(patient):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "hello", "target_language": "en-IN"},
        headers={"X-Patient-PIN-Token": patient["token"]},
        timeout=35,
    )
    # 200 if Sarvam reachable, 502/504 acceptable if not — but must NOT be validation/auth error
    assert r.status_code in (200, 502, 504), f"unexpected status {r.status_code}: {r.text}"


# ---------- SOS two-stage ----------
def _iso():
    return time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())


def test_sos_trigger_no_token_401(patient):
    r = requests.post(
        f"{API}/sos/trigger",
        json={"sos_alert_id": str(uuid.uuid4()), "patient_id": patient["patient_id"], "triggered_at": _iso()},
        timeout=15,
    )
    assert r.status_code == 401


def test_sos_trigger_patient_mismatch_403(caregiver, patient):
    # Create another patient and use its token
    r = requests.post(
        f"{API}/patient-profile/create",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"name": "Mismatch", "preferred_language": "en", "pin": "1234", "consent_confirmed": True},
        timeout=15,
    )
    other_pid = r.json()["patient_id"]
    r2 = requests.post(f"{API}/auth/patient/verify-pin", json={"patient_id": other_pid, "pin": "1234"}, timeout=15)
    other_tok = r2.json()["patient_session_token"]
    rr = requests.post(
        f"{API}/sos/trigger",
        headers={"X-Patient-PIN-Token": other_tok},
        json={"sos_alert_id": str(uuid.uuid4()), "patient_id": patient["patient_id"], "triggered_at": _iso()},
        timeout=15,
    )
    assert rr.status_code == 403


def test_sos_trigger_idempotent_no_duplicate_feed(caregiver, patient):
    sos_id = str(uuid.uuid4())
    headers = {"X-Patient-PIN-Token": patient["token"]}
    body = {"sos_alert_id": sos_id, "patient_id": patient["patient_id"], "triggered_at": _iso(),
            "location": {"lat": 22.57, "long": 88.36}}
    # Fetch alerts BEFORE (as linked caregiver)
    cg_h = {"Authorization": f"Bearer {caregiver['token']}"}
    r0 = requests.get(f"{API}/dashboard/alerts/{patient['patient_id']}", headers=cg_h, timeout=15)
    assert r0.status_code == 200
    before = len(r0.json()["alerts"])

    r1 = requests.post(f"{API}/sos/trigger", json=body, headers=headers, timeout=15)
    assert r1.status_code == 200 and r1.json()["sos_alert_id"] == sos_id
    r2 = requests.post(f"{API}/sos/trigger", json=body, headers=headers, timeout=15)
    assert r2.status_code == 200 and r2.json()["sos_alert_id"] == sos_id

    r3 = requests.get(f"{API}/dashboard/alerts/{patient['patient_id']}", headers=cg_h, timeout=15)
    after = r3.json()["alerts"]
    sos_alerts_for_id = [a for a in after if a.get("type") == "sos"]
    # Exactly one new sos alerts_feed entry created for this trigger
    assert len(after) == before + 1, f"feed grew by {len(after)-before}, expected 1"
    assert len(sos_alerts_for_id) >= 1


def test_sos_detail_updates_same_record(patient):
    sos_id = str(uuid.uuid4())
    headers = {"X-Patient-PIN-Token": patient["token"]}
    body = {"sos_alert_id": sos_id, "patient_id": patient["patient_id"], "triggered_at": _iso()}
    requests.post(f"{API}/sos/trigger", json=body, headers=headers, timeout=15).raise_for_status()
    rp = requests.patch(
        f"{API}/sos/{sos_id}/detail",
        json={"transcribed_text": "I feel dizzy", "raw_audio_url": None},
        headers=headers, timeout=15,
    )
    assert rp.status_code == 200, rp.text
    # verify via /sos/active — should list same sos with transcribed_text set
    ra = requests.get(f"{API}/sos/active?patient_id={patient['patient_id']}", headers=headers, timeout=15)
    assert ra.status_code == 200
    active = ra.json()["active"]
    match = [s for s in active if s["sos_alert_id"] == sos_id]
    assert len(match) == 1, f"expected exactly 1 sos record with id {sos_id}, got {len(match)}"
    assert match[0]["transcribed_text"] == "I feel dizzy"
    assert match[0]["detail_received_at"] is not None


def test_sos_detail_unknown_id_404(patient):
    headers = {"X-Patient-PIN-Token": patient["token"]}
    r = requests.patch(f"{API}/sos/{uuid.uuid4()}/detail",
                       json={"transcribed_text": "x"}, headers=headers, timeout=15)
    assert r.status_code == 404


def test_sos_resolve_requires_linked_caregiver(caregiver, patient):
    # Trigger an SOS
    sos_id = str(uuid.uuid4())
    requests.post(
        f"{API}/sos/trigger",
        headers={"X-Patient-PIN-Token": patient["token"]},
        json={"sos_alert_id": sos_id, "patient_id": patient["patient_id"], "triggered_at": _iso()},
        timeout=15,
    ).raise_for_status()

    # Unlinked caregiver -> 403
    email = f"unlinked_{_uniq()}@example.com"
    r = requests.post(f"{API}/auth/caregiver/signup", json={"email": email, "password": "secret1"}, timeout=15)
    other_tok = r.json()["token"]
    r1 = requests.patch(
        f"{API}/sos/{sos_id}/resolve",
        headers={"Authorization": f"Bearer {other_tok}"},
        json={"status": "acknowledged"}, timeout=15,
    )
    assert r1.status_code == 403

    # No caregiver token -> 401
    r_noauth = requests.patch(f"{API}/sos/{sos_id}/resolve", json={"status": "acknowledged"}, timeout=15)
    assert r_noauth.status_code == 401

    # Linked caregiver -> 200 acknowledged, then resolved
    r2 = requests.patch(
        f"{API}/sos/{sos_id}/resolve",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"status": "acknowledged"}, timeout=15,
    )
    assert r2.status_code == 200
    r3 = requests.patch(
        f"{API}/sos/{sos_id}/resolve",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"status": "resolved"}, timeout=15,
    )
    assert r3.status_code == 200


def test_sos_resolve_unknown_id_404(caregiver):
    r = requests.patch(
        f"{API}/sos/{uuid.uuid4()}/resolve",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"status": "acknowledged"}, timeout=15,
    )
    assert r.status_code == 404


# ---------- Geofence ----------
def test_geofence_breach_creates_alert(caregiver, patient):
    cg_h = {"Authorization": f"Bearer {caregiver['token']}"}
    r0 = requests.get(f"{API}/dashboard/alerts/{patient['patient_id']}", headers=cg_h, timeout=15)
    before = len(r0.json()["alerts"])
    r = requests.post(
        f"{API}/alerts/geofence",
        headers={"X-Patient-PIN-Token": patient["token"]},
        json={"patient_id": patient["patient_id"],
              "location": {"lat": 22.60, "long": 88.40}, "recorded_at": _iso()},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json()["type"] == "geofence_exit"
    r1 = requests.get(f"{API}/dashboard/alerts/{patient['patient_id']}", headers=cg_h, timeout=15)
    after = r1.json()["alerts"]
    assert len(after) == before + 1
    assert after[0]["type"] == "geofence_exit"


def test_geofence_patient_mismatch_403(caregiver, patient):
    r = requests.post(
        f"{API}/patient-profile/create",
        headers={"Authorization": f"Bearer {caregiver['token']}"},
        json={"name": "GeoMis", "preferred_language": "en", "pin": "1234", "consent_confirmed": True},
        timeout=15,
    )
    other_pid = r.json()["patient_id"]
    r2 = requests.post(f"{API}/auth/patient/verify-pin", json={"patient_id": other_pid, "pin": "1234"}, timeout=15)
    other_tok = r2.json()["patient_session_token"]
    rr = requests.post(
        f"{API}/alerts/geofence",
        headers={"X-Patient-PIN-Token": other_tok},
        json={"patient_id": patient["patient_id"],
              "location": {"lat": 1, "long": 2}, "recorded_at": _iso()},
        timeout=15,
    )
    assert rr.status_code == 403


# ---------- Dashboard reads ----------
def test_dashboard_alerts_requires_linked_caregiver(caregiver, patient):
    # Unlinked caregiver -> 403
    email = f"unlinked2_{_uniq()}@example.com"
    r = requests.post(f"{API}/auth/caregiver/signup", json={"email": email, "password": "secret1"}, timeout=15)
    tok = r.json()["token"]
    r1 = requests.get(
        f"{API}/dashboard/alerts/{patient['patient_id']}",
        headers={"Authorization": f"Bearer {tok}"}, timeout=15,
    )
    assert r1.status_code == 403

    r_noauth = requests.get(f"{API}/dashboard/alerts/{patient['patient_id']}", timeout=15)
    assert r_noauth.status_code == 401

    # Linked ok, newest-first
    r2 = requests.get(
        f"{API}/dashboard/alerts/{patient['patient_id']}",
        headers={"Authorization": f"Bearer {caregiver['token']}"}, timeout=15,
    )
    assert r2.status_code == 200
    alerts = r2.json()["alerts"]
    assert isinstance(alerts, list)
    if len(alerts) >= 2:
        assert alerts[0]["created_at"] >= alerts[1]["created_at"], "alerts must be newest-first"


def test_dashboard_location_requires_linked_caregiver(caregiver, patient):
    email = f"unlinked3_{_uniq()}@example.com"
    r = requests.post(f"{API}/auth/caregiver/signup", json={"email": email, "password": "secret1"}, timeout=15)
    tok = r.json()["token"]
    r1 = requests.get(
        f"{API}/dashboard/location/{patient['patient_id']}",
        headers={"Authorization": f"Bearer {tok}"}, timeout=15,
    )
    assert r1.status_code == 403
    r2 = requests.get(
        f"{API}/dashboard/location/{patient['patient_id']}",
        headers={"Authorization": f"Bearer {caregiver['token']}"}, timeout=15,
    )
    assert r2.status_code == 200
    body = r2.json()
    assert "current" in body and "trail" in body
