import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

import db as dbmod
import notifications as notif
import sarvam
import security as sec

app = FastAPI(title="CareCompanion AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ------------------------- Schemas -------------------------
class CaregiverAuth(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(min_length=4)


class VerifyPin(BaseModel):
    patient_id: str
    pin: str


class ReminderTemplate(BaseModel):
    reminder_id: str = Field(default_factory=new_id)
    type: Literal["water", "medicine", "meal", "sleep", "exercise", "game"]
    title: str
    scheduled_time: str  # HH:MM
    notes: Optional[str] = None


class SafeZone(BaseModel):
    lat: float
    long: float
    radius_m: int


class PatientProfileCreate(BaseModel):
    name: str
    photo_url: Optional[str] = None
    preferred_language: Literal["as", "mni", "hi", "bn", "en"] = "en"
    pin: str = Field(min_length=4, max_length=12)
    reminder_templates: list[ReminderTemplate] = []
    safe_zone: Optional[SafeZone] = None
    consent_confirmed: bool = False


class PatientProfilePatch(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None
    preferred_language: Optional[Literal["as", "mni", "hi", "bn", "en"]] = None
    pin: Optional[str] = None
    reminder_templates: Optional[list[ReminderTemplate]] = None
    safe_zone: Optional[SafeZone] = None
    consent_confirmed: Optional[bool] = None


class GameSession(BaseModel):
    session_id: str
    patient_id: str
    game_id: str
    difficulty_level: int
    score: float
    accuracy: float
    completion_time_ms: Optional[int] = None
    hints_used: int = 0
    skipped_questions: int = 0
    quit_event: bool = False
    frustration_signal: bool = False
    played_at: str


class StickyNote(BaseModel):
    note_id: str
    patient_id: str
    text: str
    created_at: str


class ReminderLog(BaseModel):
    log_id: str
    patient_id: str
    reminder_type: Literal["water", "medicine", "meal", "sleep", "exercise", "game"]
    scheduled_at: str
    status: Literal["pending", "completed", "skipped", "missed", "unanswered"]
    responded_at: Optional[str] = None


class LocationPing(BaseModel):
    ping_id: str
    patient_id: str
    lat: float
    long: float
    recorded_at: str
    battery_pct: int


class SyncPush(BaseModel):
    game_sessions: list[GameSession] = []
    sticky_notes: list[StickyNote] = []
    reminder_logs: list[ReminderLog] = []
    location_pings: list[LocationPing] = []


class VoiceAsr(BaseModel):
    audio_base64: str
    source_language: Literal["as-IN", "mni-IN", "hi-IN", "bn-IN", "en-IN"]


class VoiceTts(BaseModel):
    text: str
    target_language: Literal["as-IN", "mni-IN", "hi-IN", "bn-IN", "en-IN"]


# ------------------------- Startup -------------------------
@app.on_event("startup")
async def _startup():
    try:
        await dbmod.ensure_indexes()
    except Exception as e:
        print("index setup warning:", e)


def clean(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


async def require_link(caregiver_id: str, patient_id: str):
    link = await dbmod.get_db().caregiver_links.find_one(
        {"patient_id": patient_id, "caregiver_id": caregiver_id}
    )
    if not link:
        raise HTTPException(403, "Caregiver not linked to this patient")
    return link


# ------------------------- Health -------------------------
@app.get("/api/health")
@app.get("/api/v1/health")
async def health():
    try:
        await dbmod.get_client().admin.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return {"status": "ok", "mongo": mongo_ok, "time": now_iso()}


# ------------------------- Auth -------------------------
@app.post("/api/v1/auth/caregiver/signup")
async def caregiver_signup(body: CaregiverAuth):
    if not body.email and not body.phone:
        raise HTTPException(422, "email or phone required")
    db = dbmod.get_db()
    query = {"$or": []}
    if body.email:
        query["$or"].append({"email": body.email})
    if body.phone:
        query["$or"].append({"phone": body.phone})
    if await db.users.find_one(query):
        raise HTTPException(409, "Account already exists")
    user = {
        "user_id": new_id(),
        "role": "caregiver",
        "email": body.email,
        "phone": body.phone,
        "password_hash": sec.hash_secret(body.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    return {"user_id": user["user_id"], "token": sec.make_caregiver_token(user["user_id"])}


@app.post("/api/v1/auth/caregiver/login")
async def caregiver_login(body: CaregiverAuth):
    db = dbmod.get_db()
    query = {"$or": []}
    if body.email:
        query["$or"].append({"email": body.email})
    if body.phone:
        query["$or"].append({"phone": body.phone})
    if not query["$or"]:
        raise HTTPException(422, "email or phone required")
    user = await db.users.find_one(query)
    if not user or not sec.verify_secret(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    return {"user_id": user["user_id"], "token": sec.make_caregiver_token(user["user_id"])}


@app.post("/api/v1/auth/patient/verify-pin")
async def verify_pin(body: VerifyPin):
    db = dbmod.get_db()
    sec.check_pin_lockout(body.patient_id)
    profile = await db.patient_profiles.find_one({"patient_id": body.patient_id})
    if not profile or not sec.verify_secret(body.pin, profile.get("pin_hash", "")):
        sec.record_pin_failure(body.patient_id)
        raise HTTPException(401, "Invalid PIN")
    sec.reset_pin_attempts(body.patient_id)
    return {"patient_session_token": sec.make_patient_token(body.patient_id)}


# ------------------------- Patient Profile -------------------------
@app.post("/api/v1/patient-profile/create")
async def create_profile(body: PatientProfileCreate, caregiver_id: str = Depends(sec.get_current_caregiver)):
    if not body.consent_confirmed:
        raise HTTPException(422, "Consent must be confirmed")
    db = dbmod.get_db()
    patient_id = new_id()
    profile = {
        "patient_id": patient_id,
        "primary_caregiver_id": caregiver_id,
        "name": body.name,
        "photo_url": body.photo_url,
        "preferred_language": body.preferred_language,
        "pin_hash": sec.hash_secret(body.pin),
        "reminder_templates": [r.model_dump() for r in body.reminder_templates],
        "safe_zone": body.safe_zone.model_dump() if body.safe_zone else None,
        "calibration_score": None,
        "calibration_tier": None,
        "calibration_completed_at": None,
        "consent_confirmed": body.consent_confirmed,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.patient_profiles.insert_one(profile)
    await db.caregiver_links.insert_one({
        "link_id": new_id(),
        "patient_id": patient_id,
        "caregiver_id": caregiver_id,
        "access_level": "primary",
        "linked_at": now_iso(),
    })
    return {"patient_id": patient_id}


def profile_public(profile: dict) -> dict:
    p = clean(profile)
    p.pop("pin_hash", None)
    return p


@app.get("/api/v1/patient-profile/{patient_id}/as-caregiver")
async def get_profile_caregiver(patient_id: str, caregiver_id: str = Depends(sec.get_current_caregiver)):
    await require_link(caregiver_id, patient_id)
    profile = await dbmod.get_db().patient_profiles.find_one({"patient_id": patient_id})
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile_public(profile)


@app.get("/api/v1/patient-profile/{patient_id}/as-patient")
async def get_profile_patient(patient_id: str, session_patient: str = Depends(sec.get_patient_session)):
    if session_patient != patient_id:
        raise HTTPException(403, "Patient token mismatch")
    profile = await dbmod.get_db().patient_profiles.find_one({"patient_id": patient_id})
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile_public(profile)


@app.patch("/api/v1/patient-profile/{patient_id}")
async def patch_profile(patient_id: str, body: PatientProfilePatch, caregiver_id: str = Depends(sec.get_current_caregiver)):
    db = dbmod.get_db()
    profile = await db.patient_profiles.find_one({"patient_id": patient_id})
    if not profile:
        raise HTTPException(404, "Profile not found")
    if profile["primary_caregiver_id"] != caregiver_id:
        raise HTTPException(403, "Only the primary caregiver can edit this profile")
    updates = {}
    data = body.model_dump(exclude_unset=True)
    if "pin" in data and data["pin"]:
        updates["pin_hash"] = sec.hash_secret(data.pop("pin"))
    else:
        data.pop("pin", None)
    if "reminder_templates" in data and data["reminder_templates"] is not None:
        updates["reminder_templates"] = data.pop("reminder_templates")
    if "safe_zone" in data and data["safe_zone"] is not None:
        updates["safe_zone"] = data.pop("safe_zone")
    updates.update({k: v for k, v in data.items() if v is not None})
    updates["updated_at"] = now_iso()
    await db.patient_profiles.update_one({"patient_id": patient_id}, {"$set": updates})
    return {"updated": True}


@app.post("/api/v1/patient-profile/{patient_id}/invite-code/generate")
async def generate_invite(patient_id: str, caregiver_id: str = Depends(sec.get_current_caregiver)):
    db = dbmod.get_db()
    profile = await db.patient_profiles.find_one({"patient_id": patient_id})
    if not profile:
        raise HTTPException(404, "Profile not found")
    if profile["primary_caregiver_id"] != caregiver_id:
        raise HTTPException(403, "Only the primary caregiver can invite")
    code = uuid.uuid4().hex[:8].upper()
    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    await db.invite_codes.insert_one({
        "invite_code": code, "patient_id": patient_id,
        "created_by": caregiver_id, "expires_at": expires, "redeemed": False,
    })
    return {"invite_code": code, "expires_at": expires}


class RedeemInvite(BaseModel):
    invite_code: str


@app.post("/api/v1/patient-profile/invite-code/redeem")
async def redeem_invite(body: RedeemInvite, caregiver_id: str = Depends(sec.get_current_caregiver)):
    db = dbmod.get_db()
    inv = await db.invite_codes.find_one({"invite_code": body.invite_code.upper()})
    if not inv or inv.get("redeemed"):
        raise HTTPException(404, "Invalid or used invite code")
    if datetime.fromisoformat(inv["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(410, "Invite code expired")
    try:
        await db.caregiver_links.insert_one({
            "link_id": new_id(), "patient_id": inv["patient_id"],
            "caregiver_id": caregiver_id, "access_level": "read-only",
            "linked_at": now_iso(),
        })
    except Exception:
        pass
    await db.invite_codes.update_one({"invite_code": inv["invite_code"]}, {"$set": {"redeemed": True}})
    return {"patient_id": inv["patient_id"], "access_level": "read-only"}


# ------------------------- Sync -------------------------
COLLECTION_KEY = {
    "game_sessions": "session_id",
    "sticky_notes": "note_id",
    "reminder_logs": "log_id",
    "location_pings": "ping_id",
}


@app.post("/api/v1/sync/push")
async def sync_push(body: SyncPush, patient_id: str = Depends(sec.get_patient_session)):
    db = dbmod.get_db()
    accepted = {}
    payload = body.model_dump()
    for coll, key in COLLECTION_KEY.items():
        ids = []
        for record in payload.get(coll, []):
            if record.get("patient_id") != patient_id:
                continue
            record.pop("synced", None)
            await db[coll].update_one({key: record[key]}, {"$set": record}, upsert=True)
            ids.append(record[key])
        accepted[coll] = ids
    return {"accepted_ids": accepted}


@app.get("/api/v1/sync/pull")
async def sync_pull(patient_id: str, since: Optional[str] = None, session_patient: str = Depends(sec.get_patient_session)):
    if session_patient != patient_id:
        raise HTTPException(403, "Patient token mismatch")
    db = dbmod.get_db()
    profile = await db.patient_profiles.find_one({"patient_id": patient_id})
    profile_updates = None
    if profile:
        updated_at = profile.get("updated_at")
        if not since or (updated_at and updated_at > since):
            profile_updates = profile_public(profile)
    return {"profile_updates": profile_updates, "server_time": now_iso()}


# ------------------------- Voice Proxy -------------------------
@app.post("/api/v1/voice/asr")
async def voice_asr(body: VoiceAsr, patient_id: str = Depends(sec.get_patient_session)):
    return await sarvam.transcribe(body.audio_base64, body.source_language)


@app.post("/api/v1/voice/tts")
async def voice_tts(body: VoiceTts, patient_id: str = Depends(sec.get_patient_session)):
    return await sarvam.synthesize(body.text, body.target_language)



# ------------------------- SOS (Two-Stage) -------------------------
class LatLong(BaseModel):
    lat: float
    long: float


class SosTrigger(BaseModel):
    sos_alert_id: str
    patient_id: str
    triggered_at: str
    location: Optional[LatLong] = None


class SosDetail(BaseModel):
    transcribed_text: Optional[str] = None
    raw_audio_url: Optional[str] = None


class SosResolve(BaseModel):
    status: Literal["acknowledged", "resolved"]


class GeofenceEvent(BaseModel):
    patient_id: str
    location: LatLong
    recorded_at: str


async def _add_alert(patient_id: str, atype: str, message: str) -> dict:
    alert = {
        "alert_id": new_id(),
        "patient_id": patient_id,
        "type": atype,
        "message": message,
        "created_at": now_iso(),
        "read": False,
    }
    await dbmod.get_db().alerts_feed.insert_one(alert)
    return clean(alert)


@app.post("/api/v1/sos/trigger")
async def sos_trigger(body: SosTrigger, patient_id: str = Depends(sec.get_patient_session)):
    if body.patient_id != patient_id:
        raise HTTPException(403, "Patient token mismatch")
    db = dbmod.get_db()
    record = {
        "sos_alert_id": body.sos_alert_id,
        "patient_id": patient_id,
        "triggered_at": body.triggered_at,
        "location": body.location.model_dump() if body.location else None,
        "status": "triggered",
        "transcribed_text": None,
        "raw_audio_url": None,
        "detail_received_at": None,
        "acknowledged_by": None,
        "resolved_at": None,
    }
    # Idempotent create (safe to retry from offline queue).
    result = await db.sos_alerts.update_one(
        {"sos_alert_id": body.sos_alert_id}, {"$setOnInsert": record}, upsert=True
    )
    if result.upserted_id is not None:
        alert = await _add_alert(patient_id, "sos", "SOS triggered by patient")
        await notif.provider.notify_caregivers(
            patient_id,
            {"kind": "sos", "sos_alert_id": body.sos_alert_id, "status": "triggered",
             "location": record["location"], "triggered_at": body.triggered_at, "alert": alert},
        )
    return {"sos_alert_id": body.sos_alert_id, "status": "triggered"}


@app.patch("/api/v1/sos/{sos_alert_id}/detail")
async def sos_detail(sos_alert_id: str, body: SosDetail, patient_id: str = Depends(sec.get_patient_session)):
    db = dbmod.get_db()
    existing = await db.sos_alerts.find_one({"sos_alert_id": sos_alert_id, "patient_id": patient_id})
    if not existing:
        raise HTTPException(404, "SOS alert not found")
    await db.sos_alerts.update_one(
        {"sos_alert_id": sos_alert_id},
        {"$set": {
            "transcribed_text": body.transcribed_text,
            "raw_audio_url": body.raw_audio_url,
            "detail_received_at": now_iso(),
        }},
    )
    await notif.provider.notify_caregivers(
        patient_id,
        {"kind": "sos_detail", "sos_alert_id": sos_alert_id, "transcribed_text": body.transcribed_text},
    )
    return {"updated": True}


@app.patch("/api/v1/sos/{sos_alert_id}/resolve")
async def sos_resolve(sos_alert_id: str, body: SosResolve, caregiver_id: str = Depends(sec.get_current_caregiver)):
    db = dbmod.get_db()
    sos = await db.sos_alerts.find_one({"sos_alert_id": sos_alert_id})
    if not sos:
        raise HTTPException(404, "SOS alert not found")
    await require_link(caregiver_id, sos["patient_id"])
    updates: dict = {"status": body.status, "acknowledged_by": caregiver_id}
    if body.status == "resolved":
        updates["resolved_at"] = now_iso()
    await db.sos_alerts.update_one({"sos_alert_id": sos_alert_id}, {"$set": updates})
    return {"updated": True}


@app.get("/api/v1/sos/active")
async def sos_active(patient_id: str, session_patient: str = Depends(sec.get_patient_session)):
    if session_patient != patient_id:
        raise HTTPException(403, "Patient token mismatch")
    db = dbmod.get_db()
    rows = db.sos_alerts.find({"patient_id": patient_id, "status": {"$ne": "resolved"}})
    return {"active": [clean(r) async for r in rows]}


# ------------------------- Geofence & Alerts -------------------------
@app.post("/api/v1/alerts/geofence")
async def geofence_breach(body: GeofenceEvent, patient_id: str = Depends(sec.get_patient_session)):
    if body.patient_id != patient_id:
        raise HTTPException(403, "Patient token mismatch")
    alert = await _add_alert(patient_id, "geofence_exit", "Patient has left the safe zone")
    await notif.provider.notify_caregivers(
        patient_id,
        {"kind": "geofence_exit", "location": body.location.model_dump(),
         "recorded_at": body.recorded_at, "alert": alert},
    )
    return {"alert_id": alert["alert_id"], "type": "geofence_exit"}


@app.get("/api/v1/dashboard/alerts/{patient_id}")
async def dashboard_alerts(patient_id: str, caregiver_id: str = Depends(sec.get_current_caregiver)):
    await require_link(caregiver_id, patient_id)
    db = dbmod.get_db()
    rows = db.alerts_feed.find({"patient_id": patient_id}).sort("created_at", -1).limit(50)
    return {"alerts": [clean(r) async for r in rows]}


@app.get("/api/v1/dashboard/location/{patient_id}")
async def dashboard_location(patient_id: str, caregiver_id: str = Depends(sec.get_current_caregiver)):
    await require_link(caregiver_id, patient_id)
    db = dbmod.get_db()
    rows = await db.location_pings.find({"patient_id": patient_id}).sort("recorded_at", -1).limit(200).to_list(200)
    trail = [clean(r) for r in rows]
    return {"current": trail[0] if trail else None, "trail": trail}


# ------------------------- Caregiver dashboard live socket -------------------------
@app.websocket("/api/v1/ws/caregiver/{caregiver_id}")
async def caregiver_ws(websocket: WebSocket, caregiver_id: str):
    await notif.manager.connect(caregiver_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notif.manager.disconnect(caregiver_id, websocket)
    except Exception:
        notif.manager.disconnect(caregiver_id, websocket)
