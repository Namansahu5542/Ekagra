# Technology Stack Document
## AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients (NER)
### Built on Emergent Pro

---

## 1. Overview

This stack is designed around Emergent's native output (React Native + Expo frontend,
FastAPI/Python backend, MongoDB database), extended with the specific libraries and
services needed for offline-first operation, multilingual voice AI, live location
tracking, and emergency alerting. The guiding principle throughout: **the patient-facing
app must function fully offline**; online services (Sarvam AI voice, real-time alert
delivery) layer on top opportunistically. Push notifications (FCM) and an SMS gateway
are not currently provisioned — real-time caregiver alerts run on WebSocket + in-app
delivery only until those are added (see Sections 4, 6, 8).

---

## 2. Frontend — Patient & Caregiver Mobile App

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React Native + Expo** | Cross-platform (Android + iOS) from a single codebase; Emergent's native mobile output |
| State management | **Redux Toolkit** | Manages game state, Levels 1–4, sync queue, and auth state across the app |
| Navigation | **React Navigation** (role-based stacks) | Two conditional navigation stacks — Patient Mode (simplified) and Caregiver Mode (full dashboard) — switched based on logged-in role |
| Local database | **SQLite** (via `expo-sqlite`) | Stores game sessions, calibration scores, notes, reminder logs, location queue, and SOS records locally — the backbone of offline-first operation |
| Local asset bundling | **Expo FileSystem** | Bundles all game images/audio at install time so games run without any network dependency |
| UI components | **React Native Paper** + custom large-touch-target components | Elderly-friendly UI: large fonts, high contrast, big buttons |
| SVG-based games | **react-native-svg** | Renders Maze paths and the interactive Clock Readings game |
| Location | **expo-location** | Background location capture with adaptive polling frequency + geofence detection |
| Notifications (local) | **Expo Notifications** | Schedules water, medicine, meal, sleep, exercise, and game reminders — fires without connectivity |
| TTS fallback (offline) | **expo-speech** | Basic on-device voice output (English/Hindi) when Sarvam AI is unreachable |
| Localization (UI text) | **react-i18next** | Manages all on-screen text across Assamese, Meitei, Hindi, Bengali, English |
| Maps (mobile) | **react-native-maps** | Displays live location + safe zone boundary on the caregiver's map view |

---

## 3. Caregiver Web Dashboard

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React (web)** | Separate web app for caregivers who prefer checking in from a browser/laptop |
| Charts | **Recharts** | Recorded game-performance trend graphs and optional calibration history |
| Maps (web) | **Google Maps JavaScript API** or **Leaflet** | Live location + safe zone visualization on desktop |
| Real-time updates | **WebSocket** or short-polling | Updates SOS alert cards in place (Stage 2 detail arriving) without requiring a page refresh |

---

## 4. Backend

| Layer | Technology | Purpose |
|---|---|---|
| API framework | **FastAPI (Python)** | Emergent's default backend; async support suits real-time sync and alert dispatch |
| Database | **MongoDB** | Flexible schema fits varied data shapes (game sessions, multilingual content, sync queues) |
| Authentication | **JWT-based auth** | Two roles — caregiver (full auth) and patient (PIN-based, tied to profile, not full account) |
| Sync engine | **REST endpoints**: `/sync/push`, `/sync/pull` | Reconciles offline-queued data (games, notes, location, SOS) with timestamp-based conflict resolution when the device reconnects |
| Real-time alert dispatch | **WebSocket** (dashboard live-updates); **FCM push deferred — not currently provisioned** | Delivers SOS/geofence/performance-change alerts to caregivers with minimal latency, currently limited to open/connected dashboard sessions until FCM is added |

---

## 5. Voice AI & Multilingual Layer

| Component | Technology | Purpose |
|---|---|---|
| ASR + TTS (online) | **Sarvam AI API** | Speech-to-text and natural voice output in Assamese, Meitei, Hindi, Bengali, English |
| ASR + TTS (offline fallback) | Pre-recorded audio prompts + **expo-speech** | Ensures voice interaction and reminders still work without connectivity |
| Intent matching | Lightweight rule-based matcher (custom, in backend or on-device) | Matches transcribed/translated text to known commands (start game, remind me, call caregiver) — no ML model needed for MVP |

---

## 6. Safety & Emergency Systems

| Component | Technology | Purpose |
|---|---|---|
| Geofencing | **expo-location** geofencing API | Detects when patient exits the caregiver-defined safe zone |
| Real-time alerts (current) | **WebSocket + in-app** | Delivers SOS, geofence-exit, and performance-change alerts to all linked caregivers' open/connected dashboard sessions simultaneously |
| Push notifications (deferred) | **Firebase Cloud Messaging (FCM)** — not currently provisioned | Would deliver alerts to caregivers even when the app is closed; needed before real-patient/pilot use given the safety-critical nature of SOS |
| SMS fallback (deferred) | **Twilio** (or equivalent SMS gateway) — not currently provisioned | Would be the backup delivery channel for SOS alerts when push cannot be delivered; currently no fallback exists if a caregiver's dashboard is closed and offline |
| SOS audio capture | **expo-av** (audio recording) | Records patient's spoken message during SOS Stage 2, stored locally if offline |

---

## 7. Adaptive Difficulty & Calibration Engine

| Component | Technology | Purpose |
|---|---|---|
| Scoring logic | Shared JS/TS module (rule-based, no ML) | Computes Performance Score per round; identical logic runs on-device (offline) and would run server-side for any backend recomputation |
| Adaptive coach | Shared deterministic JS/TS module | Uses recent sessions and configured thresholds to recommend Level 1–4; changes at most one level at a time after three consistent sessions |
| Calibration (deferred) | Optional extension of the same policy | May recommend an initial Level 1–4 only after the MVP flow is validated; it is not a medical assessment |
| Storage | Local SQLite (device) → synced to MongoDB (backend) | Session-by-session data, recommendations, and optional calibration results persist both locally and centrally |

---

## 8. Consolidated Stack Summary

```
FRONTEND (Mobile — Patient + Caregiver)
├── React Native + Expo
├── Redux Toolkit
├── React Navigation (role-based stacks)
├── SQLite (expo-sqlite) — offline data store
├── Expo FileSystem — bundled game/audio assets
├── React Native Paper — accessible UI components
├── react-native-svg — Maze, Clock Readings
├── expo-location — background location + geofencing
├── Expo Notifications — local reminder scheduling
├── expo-speech — offline TTS fallback
├── expo-av — SOS audio recording
├── react-i18next — multilingual UI text
└── react-native-maps — location display

FRONTEND (Web — Caregiver Dashboard)
├── React
├── Recharts — score trend graphs
├── Google Maps API / Leaflet — location display
└── WebSocket — live alert updates

BACKEND
├── FastAPI (Python)
├── MongoDB
├── JWT auth (caregiver) + PIN-based patient profiles
├── REST sync endpoints (/sync/push, /sync/pull)
└── WebSocket server — real-time dashboard updates

EXTERNAL SERVICES
├── Sarvam AI — ASR/TTS/translation for voice assistant + reminders
├── Firebase Cloud Messaging — push notifications (DEFERRED — not provisioned)
└── Twilio (or equivalent) — SMS fallback for SOS (DEFERRED — not provisioned)

CORE ARCHITECTURAL PRINCIPLE
└── All game logic, difficulty adjustment, and calibration scoring
    run as shared functions executing identically on-device
    (offline) and are simply synced to the backend when online —
    no feature critical to patient safety or gameplay should
    depend on a live API call to function.
```

---

## 9. Why This Stack Fits Emergent Specifically

- **Matches Emergent's native output** (React Native/Expo + FastAPI + MongoDB), so the AI builder can scaffold the majority of the app without fighting its default patterns
- **Every added library is a standard, well-documented Expo/React Native package** — Emergent can install and wire these via its package-management flow rather than needing bespoke native modules
- **Sarvam AI is currently the only genuinely custom integration** — a plain REST API, which Emergent can implement directly once given the request/response schema (as already scoped in the voice AI integration spec). FCM and Twilio are deferred (not currently provisioned); the Notification Service should be built behind a provider interface now so they can be added later without touching the SOS/geofence call sites
- **No heavy ML/AI infra required** — the "AI-driven" elements (difficulty adaptation, calibration) are deliberately rule-based, keeping the stack lightweight and fully explainable for a hackathon timeline and for clinical/audit scrutiny later
