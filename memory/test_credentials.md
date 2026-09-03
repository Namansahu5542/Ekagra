# Test Credentials — CareCompanion AI

## Environment
- Backend: FastAPI on :8001, routes prefixed `/api/v1` (health at `/api/health`).
- Database: **local MongoDB** (`mongodb://localhost:27017`, db `carecompanion`).
  NOTE: The user-provided Atlas URI is unreachable from this container (TLS internal
  error = the cluster's IP Access List does not include this container's egress IP).
  It is stored in `backend/.env` as `ATLAS_MONGO_URL_UNUSED`. To switch to Atlas, the
  user must allowlist the container IP (or 0.0.0.0/0) in Atlas Network Access, then set
  `MONGO_URL` to that URI.
- Frontend: Expo (React Native) web build served on :3000 via `expo start --web`.

## Caregiver test account (created for testing)
- email: `caregiver@example.com`
- password: `secret1`
- (Note: reserved TLDs like `.test` are rejected by email validation; use a real-format domain.)
- (Sign up new accounts freely via the Setup screen; login is tried first, then signup.)

## Patient
- Patients are created during device Setup. Default demo PIN used in Setup flow: `1234`.
- A patient_id is returned on profile creation; PIN unlocks Patient Mode.

## Patient app flow (web)
1. App opens on **Setup** (data-testid `setup-screen`) when no device profile exists.
2. Fill `setup-email`, `setup-password`, `setup-name`, pick `lang-en`, `setup-pin`=1234,
   toggle `setup-consent`, tap `setup-finish` → lands on `home-screen` (auto-unlocked).
3. On a returning device it opens `lock-screen` (PIN pad `pin-1`..`pin-0`).

## Keys (backend/.env, never exposed to client)
- SARVAM_API_KEY (voice ASR/TTS proxy) — real key provided by user.
- GOOGLE_MAPS_API_KEY — stored, not used yet (maps/geofence is a later iteration).
