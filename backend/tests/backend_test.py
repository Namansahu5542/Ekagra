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
