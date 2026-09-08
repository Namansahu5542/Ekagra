import os
import time
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")


def hash_secret(raw: str) -> str:
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_secret(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _make_token(payload: dict, ttl_hours: float) -> str:
    now = datetime.now(timezone.utc)
    data = {**payload, "iat": now, "exp": now + timedelta(hours=ttl_hours)}
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGO)


def make_caregiver_token(user_id: str) -> str:
    ttl = float(os.getenv("CAREGIVER_TOKEN_TTL_HOURS", "168"))
    return _make_token({"sub": user_id, "role": "caregiver"}, ttl)


def make_patient_token(patient_id: str) -> str:
    ttl = float(os.getenv("PATIENT_TOKEN_TTL_HOURS", "12"))
    return _make_token({"sub": patient_id, "role": "patient"}, ttl)


def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_current_caregiver(authorization: str = Header(default="")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing caregiver bearer token")
    claims = _decode(authorization.split(" ", 1)[1])
    if claims.get("role") != "caregiver":
        raise HTTPException(403, "Caregiver token required")
    return claims["sub"]


async def get_patient_session(x_patient_pin_token: str = Header(default="")) -> str:
    if not x_patient_pin_token:
        raise HTTPException(401, "Missing patient session token")
    claims = _decode(x_patient_pin_token)
    if claims.get("role") != "patient":
        raise HTTPException(403, "Patient token required")
    return claims["sub"]


# --- Simple in-process PIN brute-force guard (per patient_id) ---
_attempts: dict[str, list] = {}


def check_pin_lockout(patient_id: str):
    max_attempts = int(os.getenv("PIN_MAX_ATTEMPTS", "5"))
    lockout = int(os.getenv("PIN_LOCKOUT_SECONDS", "300"))
    now = time.time()
    hist = [t for t in _attempts.get(patient_id, []) if now - t < lockout]
    _attempts[patient_id] = hist
    if len(hist) >= max_attempts:
        raise HTTPException(429, "Too many PIN attempts. Try again later.")


def record_pin_failure(patient_id: str):
    _attempts.setdefault(patient_id, []).append(time.time())


def reset_pin_attempts(patient_id: str):
    _attempts.pop(patient_id, None)
