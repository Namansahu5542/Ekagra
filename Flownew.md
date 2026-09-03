# End-to-End Application Flow
## AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients (NER)

---

## PHASE 1: Onboarding & Setup (Caregiver-led)

```
1. Caregiver downloads app
   → "Setting up for yourself or a family member?" → selects "Family member"

2. Caregiver Signup
   → Email/phone + password or OTP → Account created

3. Guided Patient Profile Setup Wizard
   → Patient name, photo
   → Preferred language (Assamese / Meitei / Hindi / Bengali / English)
   → Set patient PIN (for unlocking patient mode on their device)
   → Add daily reminders for water, medicine, meals, sleep, exercise, and games
   → Set home address + safe zone radius (for geofencing)
   → Consent checkbox: "I confirm I am the authorized family
     member/guardian setting up this profile"

4. Device Handoff
   → Caregiver switches app to "Patient Mode" on the patient's device
   → App downloads/bundles offline game assets + audio prompts for
     the selected language (one-time, needs connectivity once)

5. (Optional) Invite Additional Family Members
   → Settings → Generate invite code/QR (time-limited)
   → Second caregiver signs up → enters code → linked with
     read-only access (primary caregiver can upgrade later)
```

**Account model:**
```
Caregiver Account (real login: email/phone + password/OTP)
        │
        └── creates → Patient Profile (PIN-based, no full auth)
                              │
                              └── shared with → additional linked
                                  caregivers via invite code
```

---

## PHASE 1.5: Deferred Calibration (Post-MVP)

```
After the MVP's three core games and deterministic Adaptive Game Coach have been validated,
the product may introduce an optional comfort-calibration flow. It is not part of the initial
patient shell, reminder, or game iterations.
        │
        ▼
Initial MVP game sessions start at Level 2 (the explicit, non-diagnostic default).
The patient can play Memory, Matching, and Sequence/Order games without a calibration screen.
        │
        ▼
Patient plays normally — these rounds look and feel IDENTICAL
to regular gameplay, no separate "test" screen, no exam framing
        │
        ▼
If calibration is later approved, record accuracy, completion time, hints, skips,
quit events, and frustration signals using the same versioned policy as the Adaptive Game Coach.
        │
        ▼
Any future calibration may recommend only a Level 1–4 starting level and must not
make a medical claim. The recommendation engine changes at most one level at a time.
```

**Why implicit, not a separate test:** no onboarding friction, no
"exam" framing that could cause anxiety, reuses existing games and
scoring logic, and requires no disclaimer machinery since it's
plainly a comfort-calibration step rather than a diagnostic claim.

**Stored once per patient when enabled:** `calibration_score`, `recommended_level`,
`completed_at` — on the patient profile.

---

## PHASE 2: Patient's Daily Experience

```
Patient opens app → enters PIN / biometric
        │
        ▼
┌────────────────────────────────────┐
│         SIMPLIFIED HOME SCREEN        │
│  (large icons, patient's language,    │
│   persistent SOS button on every      │
│   screen)                             │
└────────────────────────────────────┘
        │
   ┌────┼──────────┬────────────┬─────────────┬──────────┐
   ▼    ▼           ▼            ▼             ▼          ▼
 Games  Voice     Sticky      Reminders    Reminiscence/  SOS
        Assistant Notes      (auto-fire)   Music Corner   Button
```

### 2a. Game Round Flow (any game)

```
Game starts at its current explicit Level 1–4 (Level 2 by default until the
deterministic coach has three recent sessions for that game).
        │
        ▼
Patient plays → app logs: score, accuracy, completion time, hints,
                skipped questions, quit event, and frustration signal
        │
        ▼
Round ends → deterministic coach evaluates the last three sessions using the
versioned policy. It may increase, decrease, or maintain by exactly one level;
it never goes below Level 1 or above Level 4.
        │
        ▼
Result queued in local SQLite → synced to backend when online
```

**Initial MVP games (offline-capable):**

| Domain | Games |
|---|---|
| Memory | Memory Match |
| Object recognition | Simple Matching |
| Daily routine recall | Sequence/Order |

### 2b. Voice Assistant Flow (Sarvam AI)

```
Patient taps mic → "I'm listening..." (audio prompt)
        │
        ▼
Patient speaks in their language
        │
        ▼
   ┌─────────────┴─────────────┐
   ▼ ONLINE                    ▼ OFFLINE
Sarvam AI ASR → text        Pre-recorded fallback
Sarvam AI Translation       prompts / expo-speech
→ intent match              (limited command set)
        │                           │
        ▼                           ▼
Intent matched (play game /   Basic offline commands
remind me / call caregiver)   only
        │
        ▼
Response generated → Sarvam AI TTS → audio played back
(or pre-recorded fallback if offline)
```

### 2c. Reminder Flow

```
Local notification scheduler (Expo Notifications) fires at
scheduled time — works fully offline
        │
        ▼
Voice prompt plays (Sarvam AI TTS if online, pre-recorded
audio if offline) — e.g., "It's time to take your medicine"
        │
        ▼
Patient taps "Done" / "Snooze" → logged locally → synced
when online → visible on caregiver dashboard
        │
        ▼
If missed/unacknowledged beyond threshold → flagged for
caregiver alert (sent when connectivity available)
```

### 2d. Sticky Notes Flow

```
Patient taps Sticky Notes → Add/View note
        │
        ▼
Text entry OR voice dictation (Sarvam AI ASR, online only)
        │
        ▼
Saved to local SQLite → synced to backend when online
```

### 2e. SOS Flow (Two-Stage — Safety Critical)

```
Patient taps SOS button
        │
        ▼
3-second countdown + "Cancel" (prevents accidental triggers)
        │
        ▼ (not cancelled)
╔══════════════════════════════════════╗
║  STAGE 1: INSTANT ALERT (no waiting)   ║
╚══════════════════════════════════════╝
        │
Capture location + timestamp → create sos_alerts record locally
(status: "triggered")
        │
   ┌─────────────┴─────────────┐
   ▼ ONLINE                    ▼ OFFLINE
WebSocket + in-app alert    Queue locally — delivered via
to ALL linked caregivers'   WebSocket + in-app alert once
open dashboard sessions     connectivity returns (no SMS
        │                    fallback currently — see below)
        ▼                          │
Caregiver notified within           ▼
seconds, IF dashboard is    Caregiver sees alert once
open/connected: "🚨 SOS      reconnected; full sync happens
from [Patient] —             then
[location] — [time]"

   ⚠️ INTERIM SAFETY GAP: FCM push and an SMS gateway are not
      currently provisioned, so a caregiver with the app/dashboard
      closed will NOT be alerted until they reopen it. This is a
      known limitation, not a silent one — flagged for the product
      owner to accept explicitly or prioritize before real-patient
      use.

   ⏱️ Stage 1 complete — caregiver already alerted (if connected)
      and can act; this does NOT wait on Stage 2 below

        │
        ▼
╔══════════════════════════════════════╗
║  STAGE 2: VOICE DETAIL (async)          ║
╚══════════════════════════════════════╝
        │
Voice prompt: "I'm here. Tell me what's wrong."
Mic auto-starts (no extra tap needed)
        │
        ▼
Patient speaks → raw audio recorded
        │
   ┌─────────────┴─────────────┐
   ▼ ONLINE                    ▼ OFFLINE
Sarvam AI ASR transcribes  Store raw audio locally,
→ PATCH same sos_alert_id   queue for transcription on
with transcription + audio  reconnect → then PATCH
        │                          │
        ▼                          ▼
Caregiver dashboard updates IN PLACE (same alert card,
no duplicate notification) once transcription arrives
```

**SOS record structure (one record, two updates):**
```
sos_alerts: {
  sos_alert_id, patient_id,
  triggered_at, location, status        ← Stage 1
  transcribed_text, raw_audio_url,
  detail_received_at                     ← Stage 2
  acknowledged_by, resolved_at           ← Caregiver action
}
```

---

## PHASE 3: Behind-the-Scenes — Sync, Location, Offline/Online Bridge

```
                    ┌──────────────────────┐
                    │   Patient's Device      │
                    │  (offline-first app)    │
                    └───────────┬──────────────┘
                               │
        ┌───────────────────────┼──────────────────────┐
        ▼                       ▼                        ▼
  Local SQLite:          Background location      Local Notification
  - game sessions        capture (expo-location,   Scheduler (fires
  - notes                adaptive frequency,        without connectivity)
  - reminder logs         geofence check)
  - location queue
  - SOS records
        │                       │
        └───────────┬───────────┘
                     ▼
        [Device regains connectivity]
                     │
                     ▼
     POST /sync/push  (uploads all queued data)
     GET  /sync/pull  (fetches caregiver-side updates,
                        e.g., new reminders added remotely)
                     │
                     ▼
        ┌──────────────────────────┐
        │   FastAPI Backend           │
        │   + MongoDB                  │
        └───────────┬──────────────────┘
                     │
      ┌──────────────┼───────────────┐
      ▼               ▼               ▼
Update patient   Check geofence   Check for significant
score history     breach → alert  recorded performance change
& sync log        if outside zone  → alert if triggered
      │               │               │
      └───────┬───────┴───────┬───────┘
              ▼                ▼
      Alert delivered to all linked caregivers
      (WebSocket + in-app dashboard update — FCM push deferred,
       not yet provisioned)
```

---

## PHASE 4: Caregiver's Experience

```
Caregiver opens app (or web dashboard) → logs in
        │
        ▼
┌──────────────────────────────────────┐
│         CAREGIVER DASHBOARD              │
├──────────────────────────────────────┤
│  🚨 SOS Alerts (highest priority,        │
│     shown first if active)               │
│                                          │
│  📍 Live map: patient location +         │
│     safe zone boundary                   │
│                                          │
│  📊 Recorded game-performance trends     │
│     domain, over time)                   │
│                                          │
│  💊 Today's reminder status              │
│     (completed / missed)                 │
│                                          │
│  🔔 Unified alerts feed:                 │
│     - geofence exit                      │
│     - missed critical reminder           │
│     - significant performance-change flag│
│     - low battery on patient device      │
│                                          │
│  ⚙️ Settings: edit reminders, safe zone,  │
│     invite more family members           │
│     (primary caregiver only)             │
└──────────────────────────────────────┘
        │
        ▼
Caregiver can remotely: add/edit a reminder → syncs to
patient's device next time it's online → local notification
scheduled there
```

---

## PHASE 5: Emergency / Geofence Alert Path

```
Patient device exits safe zone geofence
        │
        ▼
Local check detects breach → if online, immediately pushes
alert; if offline, queues alert for when connectivity returns
        │
        ▼
Backend receives breach event → sends WebSocket + in-app
alert to ALL linked caregivers' open dashboard sessions
simultaneously (FCM push deferred — not yet provisioned, so
a caregiver with the app closed won't be notified until they
reopen it)
        │
        ▼
Caregiver dashboard shows: "⚠️ [Patient name] has left the
safe zone" + live map pin + last-known location + timestamp
        │
        ▼
Caregiver can tap through to full map view / call patient /
contact other linked family members
```

---

## The Three Core Loops Running Simultaneously

| Loop | Runs | Depends on connectivity? |
|---|---|---|
| **Cognitive engagement loop** | Patient plays games, difficulty adapts locally | No — fully offline capable |
| **Safety loop** | Location tracked, geofence checked, reminders fire, SOS Stage 1 | No for detection/triggering; alerts queue if offline and deliver via WebSocket/in-app once online (no FCM/SMS fallback currently — caregiver's dashboard must be open to receive alerts in real time) |
| **Visibility loop** | Caregiver dashboard reflects scores/status/location/SOS detail | Yes — this is the piece that inherently needs sync |

---

## Design Principle Summary

The patient-facing experience is engineered to **never break due to connectivity** — games, reminders, notes, and SOS triggering all function offline. The caregiver-facing experience **catches up gracefully** whenever a connection becomes available, with the SOS system's two-stage design ensuring that even the most time-critical alert never waits on a third-party API before notifying a caregiver.
