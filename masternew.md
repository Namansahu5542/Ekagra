# Master Product Requirements Document (PRD)
## AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients (NER)
### End-to-End Build Spec — Frontend + Backend + Task Division
### Target: Emergent Pro (React Native/Expo + FastAPI + MongoDB)

---

## 1. Executive Summary

A mobile application for elderly dementia patients in North East India, paired with a
caregiver dashboard for family members. Core pillars: offline-first cognitive gaming with
adaptive difficulty, multilingual voice assistance (Sarvam AI), daily-living reminders, live
location safety monitoring with geofencing, and a two-stage SOS emergency system.

**Guiding architectural rule (applies to every module below):** the patient-facing app must
be fully functional offline. Every feature spec in this document states explicitly what
must work without connectivity vs. what requires it — build order and testing must respect
this distinction, or the app breaks the core value proposition.

---

## 2. System Architecture

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│   MOBILE APP (React Native)   │        │  CAREGIVER WEB DASHBOARD (React) │
│   ┌─────────┐  ┌────────────┐│        │   ┌─────────┐  ┌────────────┐│
│   │ Patient  │  │ Caregiver   ││        │   │Dashboard│  │  Settings   ││
│   │  Mode    │  │  Mode       ││        │   │  Views  │  │             ││
│   └────┬────┘  └──────┬─────┘│        │   └────┬────┘  └──────┬─────┘│
│        │              │        │        │        │              │        │
│   ┌────┴──────────────┴────┐  │        │   ┌────┴──────────────┴────┐  │
│   │   Local SQLite (offline)│  │        │   │   (no local storage —   │  │
│   │   + Redux state          │  │        │   │    always online)       │  │
│   └────┬─────────────────────┘  │        │   └────┬─────────────────────┘  │
└────────┼──────────────────────┘        └────────┼──────────────────────┘
         │  (sync when online)                      │  (always live)
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ Auth Module │ │ Sync Module │ │ SOS Module  │ │ Alerts/Notif    │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘  │
│                          │                                          │
│                    ┌─────┴──────┐                                  │
│                    │  MongoDB    │                                  │
│                    └────────────┘                                  │
└─────────────────────┬─────────────────────┬───────────────────────┘
                       │                     │
              ┌────────┴────────┐   ┌────────┴──────────────────┐
              │  Sarvam AI API    │   │  In-app / WebSocket only  │
              │  (ASR/TTS)        │   │  (FCM + SMS gateway        │
              │                   │   │   deferred — see NFR §9)   │
              └───────────────────┘   └────────────────────────────┘
```

---

## 3. Data Models (Source of Truth — Frontend and Backend Must Match Exactly)

These are the canonical persistence and API field names. TypeScript domain models may use
camelCase only through an explicit mapper at the repository boundary; SQLite sync payloads
and MongoDB documents must use this section's snake_case names. Any un-mapped deviation is
an integration defect.

### 3.1 `users` (caregivers — MongoDB)
```json
{
  "user_id": "string (uuid)",
  "role": "caregiver",
  "email": "string | null",
  "phone": "string | null",
  "password_hash": "string",
  "created_at": "datetime"
}
```

### 3.2 `patient_profiles` (MongoDB)
```json
{
  "patient_id": "string (uuid)",
  "primary_caregiver_id": "string (ref: users.user_id)",
  "name": "string",
  "photo_url": "string | null",
  "preferred_language": "enum: as | mni | hi | bn | en",
  "pin_hash": "string",
  "reminder_templates": [
    {
      "reminder_id": "string (uuid)",
      "type": "enum: water | medicine | meal | sleep | exercise | game",
      "title": "string",
      "scheduled_time": "HH:MM",
      "notes": "string | null"
    }
  ],
  "safe_zone": { "lat": "float", "long": "float", "radius_m": "int" },
  "calibration_score": "int | null",
  "calibration_tier": "deprecated: do not use for gameplay decisions; retained only for migration | null",
  "calibration_completed_at": "datetime | null",
  "consent_confirmed": "boolean",
  "created_at": "datetime"
}
```

### 3.3 `caregiver_links` (MongoDB)
```json
{
  "link_id": "string (uuid)",
  "patient_id": "string (ref)",
  "caregiver_id": "string (ref)",
  "access_level": "enum: primary | read-only",
  "linked_at": "datetime"
}
```

### 3.4 `game_sessions` (local SQLite + synced to MongoDB)
```json
{
  "session_id": "string (uuid, generated client-side)",
  "patient_id": "string",
  "game_id": "string (e.g. 'memory_match')",
  "difficulty_level": "integer: 1 | 2 | 3 | 4",
  "score": "float",
  "accuracy": "float (0-100)",
  "completion_time_ms": "int | null",
  "hints_used": "int",
  "skipped_questions": "int",
  "quit_event": "boolean",
  "frustration_signal": "boolean",
  "played_at": "datetime",
  "synced": "boolean (local-only field, not sent to backend)"
}
```

### 3.5 `sticky_notes` (local SQLite + synced)
```json
{
  "note_id": "string (uuid)",
  "patient_id": "string",
  "text": "string",
  "created_at": "datetime",
  "synced": "boolean (local-only)"
}
```

### 3.6 `reminder_logs` (local SQLite + synced)
```json
{
  "log_id": "string (uuid)",
  "patient_id": "string",
  "reminder_type": "enum: water | medicine | meal | sleep | exercise | game",
  "scheduled_at": "datetime",
  "status": "enum: pending | completed | skipped | missed | unanswered",
  "responded_at": "datetime | null",
  "synced": "boolean (local-only)"
}
```

### 3.7 `location_pings` (local SQLite queue + synced)
```json
{
  "ping_id": "string (uuid)",
  "patient_id": "string",
  "lat": "float",
  "long": "float",
  "recorded_at": "datetime",
  "battery_pct": "int",
  "synced": "boolean (local-only)"
}
```

### 3.8 `sos_alerts` (MongoDB — primary record lives server-side once Stage 1 syncs)
```json
{
  "sos_alert_id": "string (uuid, generated client-side)",
  "patient_id": "string",
  "triggered_at": "datetime",
  "location": { "lat": "float", "long": "float" },
  "status": "enum: triggered | acknowledged | resolved",
  "transcribed_text": "string | null",
  "raw_audio_url": "string | null",
  "detail_received_at": "datetime | null",
  "acknowledged_by": "string | null (ref: users.user_id)",
  "resolved_at": "datetime | null"
}
```

### 3.9 `alerts_feed` (MongoDB — derived/generated, read-only from frontend)
```json
{
  "alert_id": "string (uuid)",
  "patient_id": "string",
  "type": "enum: geofence_exit | missed_reminder | performance_change_flag | low_battery | sos",
  "message": "string",
  "created_at": "datetime",
  "read": "boolean"
}
```

---

## 4. API Contract (Full)

All endpoints prefixed `/api/v1`. Auth via `Authorization: Bearer <JWT>` header
(caregiver endpoints) or `X-Patient-PIN-Token` (patient-scoped endpoints, issued after
local PIN verification — short-lived, device-bound).

### 4.1 Auth
```
POST /auth/caregiver/signup
  body: { email | phone, password }
  returns: { user_id, token }

POST /auth/caregiver/login
  body: { email | phone, password }
  returns: { user_id, token }

POST /auth/patient/verify-pin
  body: { patient_id, pin }
  returns: { patient_session_token }
```

### 4.2 Patient Profile
```
POST /patient-profile/create
  auth: caregiver
  body: (matches 3.2 schema, minus system fields)
  returns: { patient_id }

GET /patient-profile/{patient_id}
  auth: caregiver (must be linked) OR patient session
  returns: (3.2 schema)

PATCH /patient-profile/{patient_id}
  auth: primary caregiver only
  body: (partial 3.2 fields)
  returns: { updated: true }

POST /patient-profile/{patient_id}/invite-code/generate
  auth: primary caregiver
  returns: { invite_code, expires_at }

POST /patient-profile/invite-code/redeem
  auth: caregiver
  body: { invite_code }
  returns: { patient_id, access_level: "read-only" }
```

### 4.3 Sync (core offline-online bridge)
```
POST /sync/push
  auth: patient session token
  body: {
    game_sessions: [...],   // array of 3.4 records not yet synced
    sticky_notes: [...],    // array of 3.5 records
    reminder_logs: [...],   // array of 3.6 records
    location_pings: [...]   // array of 3.7 records
  }
  returns: { accepted_ids: { game_sessions: [...], sticky_notes: [...], 
             reminder_logs: [...], location_pings: [...] } }
  behavior: server upserts by client-generated id (idempotent — safe to 
            retry on network failure without creating duplicates)

GET /sync/pull?patient_id={id}&since={timestamp}
  auth: patient session token
  returns: {
    profile_updates: {...} | null,   // if caregiver edited profile/reminders
    server_time: "datetime"          // client stores this as new 'since' cursor
  }
```

### 4.4 SOS (Two-Stage)
```
POST /sos/trigger
  auth: patient session token
  body: { sos_alert_id (client-generated), patient_id, triggered_at, location }
  returns: { sos_alert_id, status: "triggered" }
  behavior: MUST respond in <2s; fires a WebSocket event + in-app alert 
            to all linked caregivers' dashboard sessions synchronously 
            within this request. FCM push and SMS-gateway fallback are 
            deferred (no FCM project / SMS gateway account currently 
            provisioned) — caregiver must have the dashboard open/polling 
            to receive Stage 1 alerts until a push/SMS provider is added. 
            This is a known gap, not a silent limitation: flag it clearly 
            to the product owner as a safety-critical interim state.

PATCH /sos/{sos_alert_id}/detail
  auth: patient session token
  body: { transcribed_text, raw_audio_url }
  returns: { updated: true }
  behavior: updates existing record only, triggers a lightweight 
            websocket event to caregiver dashboard (not a new push notification)

PATCH /sos/{sos_alert_id}/resolve
  auth: caregiver (any linked)
  body: { status: "acknowledged" | "resolved" }
  returns: { updated: true }
```

### 4.5 Dashboard (Caregiver-facing, read-heavy)
```
GET /dashboard/scores/{patient_id}?domain={optional}
  auth: caregiver (linked)
  returns: { calibration_history: [...], session_history: [...] }

GET /dashboard/reminders/{patient_id}?date={optional, default today}
  auth: caregiver (linked)
  returns: { reminders: [...with status] }

GET /dashboard/alerts/{patient_id}
  auth: caregiver (linked)
  returns: { alerts: [...] (3.9 schema, paginated) }

GET /dashboard/location/{patient_id}
  auth: caregiver (linked)
  returns: { current: {lat,long,recorded_at}, trail: [...last 48h] }
```

### 4.6 Voice AI Proxy (backend proxies Sarvam AI so API key never ships in the app)
```
POST /voice/asr
  auth: patient session token
  body: { audio_base64, source_language }
  returns: { transcribed_text }

POST /voice/tts
  auth: patient session token
  body: { text, target_language }
  returns: { audio_base64 }
```
**Security note:** the Sarvam AI API key must live only on the backend, never in the mobile
app bundle. Frontend always calls `/voice/asr` and `/voice/tts` on our own backend, which
then calls Sarvam AI server-side. This also gives us a single point to swap providers later
without a mobile app update.

---

## 5. Frontend Module Breakdown

(Full screen-by-screen spec already delivered separately as the Frontend PRD — referenced
here as the canonical detail source. Summary of modules for task division purposes:)

| Module | Screens | Depends on |
|---|---|---|
| Auth & Onboarding | Signup/Login, Profile Wizard, Device Handoff, Invite Redemption | Auth API (4.1), Profile API (4.2) |
| Patient Shell | Lock Screen, Home Screen, navigation shell | Auth API (4.1) |
| Games Engine | Games Hub and the three initial games (Memory Match, Simple Matching, Sequence/Order); additional games and optional calibration are post-MVP | Local SQLite only (no API dependency to play) |
| Voice Assistant | Voice Assistant screen, intent matching | Voice API (4.6), local fallback |
| Reminders | Notification handling, reminder modal | Local Notifications, Sync API (4.3) |
| Sticky Notes | Notes list, add/edit | Local SQLite, Sync API (4.3), Voice API (4.6) for dictation |
| Reminiscence/Music | Photo/audio grid, detail view | Bundled local assets only |
| SOS | Countdown overlay, Active screen, Detail screen (caregiver side) | SOS API (4.4), Location |
| Caregiver Dashboard | Dashboard home, Map, Settings | Dashboard API (4.5), Profile API (4.2) |

---

## 6. Backend Module Breakdown

| Module | Endpoints | Notes |
|---|---|---|
| Auth Service | 4.1 | JWT issuance, PIN verification with rate-limiting (prevent brute-force PIN guessing) |
| Profile Service | 4.2 | Enforces primary-caregiver-only edit rights |
| Sync Service | 4.3 | Must be idempotent (client-generated UUIDs) — this is the module most likely to cause bugs if not built carefully; write tests for duplicate-push scenarios explicitly |
| SOS Service | 4.4 | Must complete Stage 1 response in <2s; async job for Stage 2 transcription |
| Dashboard Service | 4.5 | Read-heavy, consider caching score aggregates rather than recomputing per request |
| Voice Proxy Service | 4.6 | Holds Sarvam AI credentials; implement retry/timeout (5s) with graceful error response so frontend can fall back to local audio |
| Notification Service | (internal, triggered by SOS/geofence/decline events) | Interim: WebSocket + in-app alerts only. FCM/SMS gateway not currently provisioned — build the service behind a `NotificationProvider` interface so FCM/SMS can be plugged in later without touching call sites |

---

## 7. Build Phasing — Task Division

Structured so each phase produces a working, demoable increment, and so frontend/backend
work can proceed in parallel without blocking each other (both sides build against the
Section 3/4 contracts from day one).

### Phase 1 — Foundation (Week 1)
- **Backend**: Auth module (4.1), Profile module (4.2), MongoDB schema setup (Section 3)
- **Frontend**: Caregiver Signup/Login screens, Patient Profile Setup Wizard, Device Handoff
  screen
- **Integration checkpoint**: caregiver can sign up, create a patient profile, and see it
  persisted

### Phase 2 — Offline Core (Week 2)
- **Backend**: Sync module (4.3) — push/pull endpoints, idempotency logic
- **Frontend**: Local SQLite schema (mirrors 3.4–3.7), Patient Lock Screen, Home Screen,
  Games Hub, **2–3 games fully built** (start with Memory Match, Spot the Difference,
  Story Sequencing — these validate the difficulty-tier + scoring pattern all other games
  reuse), Calibration Rounds logic
- **Integration checkpoint**: patient can play games fully offline; scores sync to backend
  when connectivity returns; calibration sets starting difficulty correctly

### Phase 3 — Remaining Games + Reminders + Notes (Week 3)
- **Backend**: no new endpoints needed (reuses Sync module)
- **Frontend**: Reminder scheduling + notification handling and Sticky Notes screen. The
  initial three-game MVP reuses the shared Level 1–4 session pattern; additional games are
  intentionally post-MVP and must not block this checkpoint.
- **Integration checkpoint**: all three MVP games are playable offline; reminders fire and
  log status; notes save and sync

### Phase 4 — Voice AI (Week 3–4, can run parallel to Phase 3)
- **Backend**: Voice Proxy module (4.6), Sarvam AI credential wiring
- **Frontend**: Voice Assistant screen, intent-matching logic, offline fallback audio system,
  voice dictation in Sticky Notes
- **Integration checkpoint**: voice command triggers a game/reminder/SOS correctly in both
  online and offline modes

### Phase 5 — Safety Systems (Week 4)
- **Backend**: SOS module (4.4), geofencing alert logic, WebSocket/in-app notification
  service built behind a `NotificationProvider` interface (FCM + SMS gateway not
  currently provisioned — plug in later without touching call sites; see NFR §9)
- **Frontend**: Location tracking (expo-location), SOS Countdown/Active screens, SOS Detail
  screen (caregiver side)
- **Integration checkpoint**: SOS Stage 1 alert reaches caregiver's open dashboard within 2
  seconds in a live test; geofence exit triggers an alert; offline SOS queues and delivers
  via WebSocket/in-app once connectivity returns (no push/SMS fallback yet — flagged as an
  interim safety gap until FCM/SMS accounts are provisioned)

### Phase 6 — Caregiver Dashboard + Alerts (Week 5)
- **Backend**: Dashboard module (4.5), alerts_feed generation logic (performance-change
  detection and aggregation; no medical inference)
- **Frontend**: Caregiver Dashboard home, Full Map screen, Alerts Feed, Settings screen,
  Invite/linking flow
- **Integration checkpoint**: caregiver sees live scores, location, reminders, and alerts
  end-to-end; second caregiver can join via invite code

### Phase 7 — Reminiscence/Music + Polish (Week 5–6)
- **Frontend only**: Reminiscence/Music Corner screen, localization pass (react-i18next
  across all 5 languages), accessibility audit (font sizes, contrast, touch targets)
- **Integration checkpoint**: full app walkthrough in at least 2 non-English languages;
  accessibility checklist passed

---

## 8. Why This Phasing Prevents Breakage

- **Contracts (Section 3–4) are fixed before any screen is built**, so frontend and backend
  can be developed simultaneously without waiting on each other or guessing field names
- **Games are built in a small batch first (Phase 2), not all 14 at once** — this catches
  any flaw in the shared scoring/difficulty pattern early, before it's replicated across 14
  screens and becomes expensive to fix
- **Sync idempotency is built and tested in Phase 2**, before any other module depends on
  it — every later phase (reminders, notes, SOS) reuses this same sync mechanism, so it must
  be solid first
- **SOS (safety-critical) is deliberately built after the sync/offline foundation is proven**,
  not simultaneously — it depends on the same offline-queue pattern being already correct
- **Voice AI runs in parallel to Phase 3**, not blocking game/reminder development, since it's
  a genuinely separate concern
- **SOS notification delivery is built behind a provider interface from the start**, so
  running on WebSocket/in-app-only for now doesn't require rework once FCM/SMS accounts
  are provisioned — the interface, not the specific vendor, is the contract other modules
  depend on

---

## 9. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Offline availability | All Patient Mode features except live voice AI and caregiver-alert delivery must work with zero connectivity |
| SOS latency | Stage 1 alert must reach caregiver within 2 seconds under normal network conditions — **currently only guaranteed if the caregiver's dashboard is open/connected via WebSocket**, since FCM push and SMS-gateway fallback are not yet provisioned. This is a real safety gap, not just a nice-to-have deferral: product owner should decide whether to provision FCM/SMS before pilot testing with real patients, or accept the interim limitation in writing |
| Data retention | Location history auto-purges after 30 days |
| Security | Sarvam AI API key server-side only; patient PIN hashed, never stored/transmitted in plaintext; all API traffic over HTTPS |
| Accessibility | Minimum 18–20pt fonts, WCAG AA contrast, 48x48dp minimum touch targets in Patient Mode |
| Localization | No hardcoded patient-facing strings — all routed through react-i18next |
| Battery | Location polling frequency must adapt (less frequent when stationary) to avoid draining device battery |

---

## 10. What to Give Emergent (Consolidated Instruction)

```
Build this application in the Iterations 0–9 defined in `cmpnew.md`, in order. Section 7
is a legacy implementation grouping only; when it differs from `cmpnew.md`, `cmpnew.md`
takes precedence.
with each phase's "Integration checkpoint" as the definition of done 
before moving to the next phase.

Use the exact data models in Section 3 for both local SQLite schema 
and MongoDB collections — frontend and backend must not diverge from 
these field names/types.

Implement all API endpoints exactly as specified in Section 4, 
including the idempotency requirement on /sync/push (client-generates 
UUIDs, server upserts — must be safe to retry).

The Sarvam AI API key must only exist in backend environment 
configuration, never in the mobile app bundle — frontend always calls 
our own /voice/asr and /voice/tts endpoints, which proxy to Sarvam AI 
server-side.

FCM and an SMS gateway are not currently provisioned. Build the 
Notification Service (Section 6) behind a NotificationProvider 
interface with a WebSocket/in-app implementation as the only active 
provider for now. Do not hardcode FCM/Twilio calls anywhere in the SOS 
or geofence alert path — the interface is the contract; the vendor 
gets plugged in later without touching call sites.

Build exactly the three MVP games first: Memory Match, Simple Matching, and
Sequence/Order. Use the shared Level 1–4 session contract and deterministic coach;
additional games are post-MVP.

SOS Stage 1 (/sos/trigger) must respond in under 2 seconds and must 
not wait on any voice/transcription processing — that is a separate, 
asynchronous Stage 2 call (/sos/{id}/detail).

Apply the non-functional requirements in Section 9 across all 
patient-facing screens without exception.
```
