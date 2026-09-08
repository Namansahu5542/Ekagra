# CareCompanion AI — PRD & Build Log

## Problem statement
Dementia-care platform for elderly patients in North East India. Offline-first React
Native/Expo **patient app** + FastAPI/MongoDB backend (caregiver web dashboard deferred).
Authoritative plan: `cmpnew.md` (Iterations 0–9). Canonical data/API contracts:
`masternew.md` §3/§4 (snake_case). Design: `DESIGN.md`. Three existing web games
(Flip Cards, Number Cards, Whack the Ball) rebuilt natively (no WebView/Babylon/canvas).

## User choices (this build)
- Deliver Iterations 0–3 foundation: backend (auth/profile/sync/game_sessions) + patient
  Expo app shell + 3 native games working offline. Include Sarvam voice now. Patient app
  only (no caregiver dashboard yet).

## Architecture
- Patient app: Expo (SDK 54) + expo-router + react-i18next (en/hi/bn/as/mni).
- Offline storage: expo-sqlite on native, localStorage fallback on web — unified `store`
  repository (`src/lib/storage.ts`). Sync via `/sync/push` (idempotent, client UUIDs).
- Backend: FastAPI (`/api/v1/*`), MongoDB, JWT caregiver auth, PIN patient sessions with
  brute-force lockout. Sarvam AI voice proxy (key backend-only).

## Data contracts (canonical, snake_case)
`game_sessions` fields exactly: session_id, patient_id, game_id
("flip_cards"|"number_cards"|"whack_the_ball"), difficulty_level(1-4), score, accuracy,
completion_time_ms, hints_used, skipped_questions, quit_event, frustration_signal,
played_at, synced(local-only). Also users, patient_profiles, caregiver_links,
sticky_notes, reminder_logs, location_pings, invite_codes.

## Implemented (2026-09-03)
- Backend: caregiver signup/login, patient PIN verify (+lockout), patient-profile CRUD
  + invite-code generate/redeem, `/sync/push` (idempotent upsert) + `/sync/pull`,
  Sarvam `/voice/asr` + `/voice/tts` proxy. Verified via curl (idempotency, lockout,
  no secret leakage).
- Patient app: Setup (caregiver-led), PIN lock, Home ("what to do now"), Games hub with
  Level 1–4, three native games (Picture Pairs/flip_cards, Number Garden/number_cards,
  Tap the Colour/whack_the_ball), Reminders (Done/Skip lifecycle), Sticky Notes, Voice
  Assistant (rule-based intents + Sarvam TTS online / expo-speech fallback), Settings
  (language switch, sync now, reset). All sessions/notes/reminder-logs stored locally and
  synced when online. Verified e2e on web (setup→home→game→result→session recorded+synced).

## Known limitations / MOCKED
- Atlas DB unreachable from container (IP allowlist) → using LOCAL MongoDB.
- Sarvam TTS supports hi/bn/en only (as/mni fall back to on-device speech). Online TTS
  playback wired on web; native TTS uses expo-speech fallback.
- SOS, geofencing, live location/maps, caregiver dashboard, adaptive coach, calibration
  = later iterations (4–9), not in this build.

## Backlog / Next (priority order)
- P1: Iteration 4 Adaptive Game Coach (deterministic level recommendation).
- P1: Iteration 6 Caregiver web dashboard (scores/reminders/alerts + live SOS socket already available at /api/v1/ws/caregiver/{id}).
- P2: Server-side geofence dedup/rate-limit; SOS resolve state machine; persist PIN lockout (currently in-process).
- P2: Native-speaker review of Manipuri (mni) translations; complete remaining mni keys.

## Implemented — Iteration 7 & 8 (2026-09-03)
- SAFETY (Iter 7): Two-stage SOS — persistent SOS button (Screen `showSos` FAB) on all patient
  screens; `app/sos.tsx` 3s countdown+cancel → Stage 1 `POST /sos/trigger` (client UUID,
  idempotent, <2s) → Stage 2 voice/text `PATCH /sos/{id}/detail` updating the SAME record.
  `PATCH /sos/{id}/resolve` (caregiver, link-checked). Live foreground location tracking +
  safe-zone geofencing (`src/lib/safety.ts`), breach → `POST /alerts/geofence`. Alerts land in
  `alerts_feed`; delivery via `NotificationProvider` interface (WebSocketProvider active; FCM/SMS
  deferred behind the interface). `GET /dashboard/alerts|location/{id}` (linked caregiver only).
  Offline SOS queued in a local outbox and flushed on reconnect. Verified: backend 26/26,
  frontend flows all pass.
- LOCALIZATION (Iter 8): Full Bengali + Assamese dictionaries; Manipuri/Meitei core+safety
  (MACHINE, pending native review). `TRANSLATION_META` tracks version/reviewer. Assamese &
  Manipuri TTS fall back to on-device speech (Sarvam TTS unsupported for as/mni).
