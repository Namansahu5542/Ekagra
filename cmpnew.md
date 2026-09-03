# CareCompanion AI — Phased Product Requirements Documents

**Version:** 1.0  
**Product:** CareCompanion AI for elderly dementia patients and their family caregivers in North East India  
**Implementation target:** Emergent Pro — React Native + Expo, FastAPI, MongoDB

## How to use this PRD pack

This document converts the requested Iterations 0–9 into independently buildable PRDs. It reconciles the end-to-end flow, master PRD, and technology stack. The iteration numbering below is the authoritative delivery order; the initial MVP includes three games, explicit Levels 1–4, and deterministic adaptation. Any larger game catalogue or calibration extension is post-MVP.

Product-wide rules apply to every iteration:

- Patient Mode is offline-first. A network outage must not prevent local games, local reminder handling, local safety-event capture, or access to already-synced patient information.
- The patient experience is calm, accessible, short, predictable, and non-medical. Use 18–20pt minimum text, WCAG AA contrast, 48×48dp minimum touch targets, large controls, and no hardcoded patient-facing strings.
- The LLM is never a system of record and never directly mutates critical state. App services validate every state change.
- Do not diagnose, assess disease progression, prescribe treatment, give doses, or state that medicine was taken without explicit recorded confirmation.
- Use client-generated IDs for offline records. Once sync exists, writes must be idempotent.
- Access to a patient's data, location, and alerts is limited to authorized linked caregivers.
- `masternew.md` Section 3 is the canonical persistence/API contract and uses snake_case.
  Patient-app TypeScript models may use camelCase only through explicit repository mappers;
  no screen or tool may serialize a domain object directly as a sync/API payload.

### Target architecture

| Layer | Required implementation direction |
|---|---|
| Patient app | React Native + Expo; React Navigation role stacks; Redux Toolkit; `expo-sqlite`; local bundled assets |
| Caregiver dashboard | React web, Recharts, and Leaflet or Google Maps when location work is in scope |
| Backend | FastAPI, MongoDB, JWT caregiver auth and patient PIN model; REST sync and WebSocket updates later |
| Voice | Sarvam AI only through a FastAPI proxy; offline pre-recorded prompts/`expo-speech` fallback |
| Safety | `expo-location`, Expo Notifications, WebSocket + in-app alert delivery now; FCM push and SMS fallback for SOS are deferred (not currently provisioned) and enter scope later behind a notification-provider interface |

---

# Iteration 0 — Project Foundation

## Goal

Create a runnable, mock-data-only codebase with stable domain boundaries. This iteration establishes contracts; it does not simulate completion of future features.

## In scope

- Scaffold the mobile app and caregiver dashboard shell using the target stack where supported by the build environment.
- Create modules/services for authentication, patient and caregiver profiles, reminders, games, game sessions, adaptive recommendations, voice assistant, daily schedule, summaries, alerts/SOS, and location/geofence events.
- Keep UI, domain services, repositories, and data types separate. Use repository interfaces with mock/local implementations.
- Define the requested entities: `Patient`, `Caregiver`, `Reminder`, `Game`, `GameSession`, `LocationEvent`, `Alert`, and `DailySummary`.
- Add local realistic fixtures: one patient, one caregiver, a week of game sessions, varied reminder states, and at least one location event.
- Establish a localization wrapper from day one; English fixture strings are sufficient in this iteration.

## Required data contracts

- `Patient`: id, name, preferredLanguage, caregiverIds, dailySchedule, preferences; reserve optional calibration fields for later.
- `Caregiver`: id, name, contactInformation, notificationPreferences, escalationPreferences.
- `Reminder`: id, patientId, type, title, scheduledTime, status, acknowledgedAt, confirmedBy, notes. Types: water, medicine, meal, sleep, exercise, game. Statuses: pending, completed, skipped, missed, unanswered.
- `GameSession`: all fields requested in the brief plus immutable client-generated id and timestamps.
- Domain services must expose read-only mock APIs, not direct fixture imports in screen components.

## Explicitly out of scope

Real login, server/database deployment, notifications, location collection, SOS delivery, STT/TTS, LLM calls, and medical functionality.

## Acceptance criteria

1. The app launches without a network connection using mock/local data.
2. Types compile and mock fixtures conform to their interfaces.
3. No screen suggests a real call, alert, live location, voice feature, or authentication occurred.
4. A developer can replace a mock repository with a SQLite/API repository without rewriting UI business rules.

---

# Iteration 1 — Patient App Shell

## Goal

Deliver an elderly-friendly Patient Mode that answers “What should I do now?” using existing mock data, without AI or real device integrations.

## In scope

- Home screen: greeting, current time, current/due activity, next activity, one prominent primary action, and clear access to Games, Today’s Activities, Help, and Call Caregiver.
- Screens: Home, Today’s Activities, Games, Game Selection, Reminder Detail, Help, Caregiver Call Confirmation, and basic Profile/Settings.
- Persistent, predictable route back to Home from every patient route.
- Use simple confirmation screens for consequential actions. Caregiver call displays `Would you like to call your family?` with explicit `YES` and `NO`; it records no real call.
- Render reminders and game lists from repositories rather than hardcoded per-screen content.

## UX requirements

- One primary action per screen; avoid menus within menus, hidden gestures, long text, motion that impedes comprehension, and jargon.
- Every status must use both plain-language text and a discernible visual cue; never rely on color alone.
- The home card must prefer the current due reminder, then the next scheduled activity, then a gentle game option.

## Out of scope

Voice, TTS, AI recommendations, notifications, calls, SOS, and location tracking.

## Acceptance criteria

1. A user can reach each listed screen and return Home without losing context.
2. Current and next activities come from mock schedule data and render correctly through day/time changes.
3. Game selection and caregiver-call confirmation are usable without performing live actions.
4. Accessibility audit passes the product-wide sizing, contrast, and touch-target rules.

---

# Iteration 2 — Reminder System

## Goal

Implement a deterministic local reminder engine and patient confirmation flow. Medication acknowledgement must be auditable and safe.

## In scope

- Support water, medicine, meal, sleep, exercise, and game reminders.
- Implement lifecycle transitions: pending → completed, skipped, missed, or unanswered. Store event timestamp and `confirmedBy`.
- Add schedule queries: current due reminder, next reminder, today’s completed/missed/unanswered reminders.
- Present a due reminder in plain language, then collect an explicit answer: `YES`, `NO`, or `NOT NOW`.
- Map `YES` to completed only after user confirmation; map `NO` and `NOT NOW` to a configured, visible non-completion state. The product owner must define the timeout that converts an unresolved reminder to missed versus unanswered; keep this policy configurable.
- Expose all records through the domain repository for later dashboard consumption.

## Safety constraints

- Never automatically complete medication. Never phrase an unconfirmed medicine event as taken.
- Do not give dosage, treatment, or clinical advice after a negative/no-response event.
- Preserve an append-only reminder-event audit trail even if the current status changes.

## Testing and acceptance criteria

Unit-test due calculation, confirmation, skip, no response, medication confirmation guard, chronological next-reminder selection, and multiple daily reminders. Integration-test that the UI cannot produce `completed` for medicine without explicit confirmation. All operations work locally while offline.

---

# Iteration 3 — Cognitive Games

## Goal

Ship three calm, playable games and reliable local session telemetry. Adaptive decisions remain out of scope.

## In scope

- Implement Memory, simple Matching, and Sequence/Order games with large controls, simple instructions, optional hints, and graceful exit.
- Support Levels 1–4, selected explicitly at launch. Persist the selected level on every session.
- Record: gameId, patientId, difficulty, score, accuracy, completionTime, hintsUsed, skippedQuestions, quitEvent, frustrationSignal, startedAt, completedAt.
- Implement `GameSessionHistoryService` queries for last session, last 3, last 7, and recent sessions by game.
- Provide neutral completion and exit copy: congratulate effort; never characterize a session as failure or evidence of decline.

## Technical requirements

- Build each game with the shared game-session contract and local SQLite-ready repository abstraction; no network dependency to play.
- `quitEvent=true` for abandonment before completion. Incomplete sessions must remain valid telemetry, not discarded data.
- Define the performance-scoring interface now, but do not use it to change levels. The source flow's score formula can be implemented later only after product validation of speed normalization and retry penalty.

## Acceptance criteria

1. Each game is independently playable at every supported level.
2. Completion and early exit each write a single valid session record.
3. History queries return ordered, patient-scoped results.
4. Automated tests validate all telemetry fields and protect against duplicate end-of-session records.

---

# Iteration 4 — Adaptive Game Coach

## Goal

Create a fully deterministic, explainable recommendation engine that chooses a game and difficulty using recorded sessions. No LLM may make this decision.

## In scope

- Inputs: score, accuracy, completion time, hints, skips, quit events, frustration signals, recent trend, current difficulty, games available, and recently played games.
- Output contract: `{ gameId, difficulty, reason, confidence, levelChange }`, where `levelChange` is `increase`, `decrease`, or `maintain`.
- Increase at most one level after strong, consistent performance across three recent sessions. A single excellent session and two strong sessions maintain level.
- Decrease one level for repeated struggle indicators; never below Level 1. Maintain at Level 4 even after strong performance.
- Incorporate variety: where equally suitable, avoid repeatedly selecting the most recently played game.
- Convert output to supportive patient copy with no clinical inference or negative judgment.

## Decision policy

Thresholds and weights must be named configuration values, versioned, and included in the recommendation reason. The exact source-flow formula/thresholds are not clinically validated; treat them as product configuration, not a medical score. For identical input data and policy version, output must be identical.

## Acceptance criteria

Automated tests cover all 11 scenarios listed in the brief, including one-level boundaries, mixed histories, quits, hints, skips, and frustration. An audit record captures input session IDs, policy version, recommendation, and timestamp. The engine can run offline.

---

# Iteration 5 — Voice Assistant

## Goal

Build a patient voice assistant that recognizes limited intents and invokes validated application tools. The LLM, if used, is constrained to intent/language assistance and cannot fabricate state or execute actions.

## In scope

- Pipeline: STT → intent detection → validated tool/action → structured result → short response → TTS.
- Support the listed schedule, game, medicine/reminder, caregiver call, and emergency intents in English and Hindi, with a language abstraction for future regional languages.
- Response contract exactly includes `patient_message`, `intent`, `recommended_action`, `requires_confirmation`, and `follow_up_question`.
- Implement tool interfaces: `getCurrentReminder`, `getNextReminder`, `getTodaySchedule`, `getRecentGamePerformance`, `getGameRecommendation`, `launchGame`, `confirmReminder`, `requestCaregiverCall`, `triggerSOS`.
- Require confirmation before caregiver call, game launch where appropriate, and medication acknowledgement. Clear emergency language bypasses confirmation and goes to the safety subsystem.
- When online, route Sarvam AI ASR/TTS only through backend `/voice/asr` and `/voice/tts`; API keys never ship to the client. When offline, support only a finite, documented command set via on-device matching and pre-recorded/`expo-speech` feedback.

## Guardrails

- Application repositories are the authority for status, identity, permissions, score, and location.
- Tools validate patient ownership and allowed state transitions. Unrecognized input gets a single simple choice, not an open-ended dialogue.

## Acceptance criteria

Typed and simulated-STT test suites cover English and Hindi variations, ambiguity, unsupported requests, confirmation, authoritative-state conflicts, and all listed intents. Tests prove model output cannot bypass an action validator.

---

# Iteration 6 — Caregiver Dashboard

## Goal

Give authorized caregivers a clear, factual dashboard without converting activity data into medical conclusions.

## In scope

- Sections: Today’s Overview, Game Performance, Reminder Adherence, Activity, Medication Acknowledgement, Hydration, Sleep, Location/Geofence Events, Alerts, Daily Summary, Weekly Summary.
- Show game count, score, accuracy, completion time, level, level changes, and recent recorded-performance trend.
- Show reminder counts by completed, skipped, missed, and unanswered. Medicine shows acknowledgement status only: confirmed by patient, confirmed by caregiver, or not confirmed.
- Produce the requested structured daily summary schema and an equivalent weekly aggregation. Suggested caregiver actions are review/contact/adjust/review actions, never medical recommendations.
- Require confirmation for critical record edits. Dashboard reads existing data; it must not silently “correct” patient history.

## Data/authorization requirements

Caregivers can load only linked patient data. Location cards and alert details honor authorization. Dashboard wording uses “performance/activity/reminder adherence changed,” not cognitive or disease claims.

## Acceptance criteria

Mock daily and weekly fixtures reproduce the correct aggregates and example narrative. Authorization tests reject unlinked caregiver access. Dashboard metrics reconcile exactly with raw repositories, including incomplete sessions and unconfirmed medication reminders.

---

# Iteration 7 — Safety, SOS, and Geofencing

## Goal

Implement an independent, auditable safety subsystem. Safety actions never wait on normal conversation or model reasoning.

## In scope

- Detect clear emergency expressions: lost, hurt, scared, danger, emergency, or needs emergency help, including supported language variations.
- On clear SOS: create a client-generated alert, capture latest available location/timestamp, notify authorized configured contacts, and display: `I am alerting your family now. Please stay where you are if it is safe.`
- Implement two-stage SOS aligned to the source flow: Stage 1 immediate alert; Stage 2 optional asynchronous voice-detail capture/transcription updates the same alert record and never creates a second emergency notification.
- Create authorized contacts, geofences, location events, breach events, escalation policies, deduplication, acknowledgement, and resolution records.
- Use `expo-location` geofencing locally; queue local events offline. Deliver alerts via WebSocket + in-app to caregivers' connected dashboard sessions. FCM push and SMS fallback for the primary caregiver are deferred — not currently provisioned; build delivery behind a notification-provider interface now so they can be added later without touching this module's call sites, and flag the resulting gap (no delivery to a closed caregiver app) per the approved emergency-delivery policy.

## Safety/privacy requirements

- Do not require confirmation for clearly expressed emergencies. Ambiguous phrases must follow a deterministic clarification/escalation policy.
- Never disclose location outside linked authorized contacts. Send the LLM only the minimal event context required for patient-facing language.
- Target Stage 1 server response/dispatch initiation under two seconds under normal network conditions. Do not promise caregiver or emergency response time.

## Acceptance criteria

Tests cover phrase detection, ambiguity, authorization, alert creation, Stage 1/Stage 2 linking, geofence breach, configured escalation, offline queueing, duplicate SOS prevention, and audit logs. A live integration test confirms configured caregiver delivery before release.

---

# Iteration 8 — Multilingual and Regional Adaptation

## Goal

Make patient-facing interactions language-aware and regionally respectful, beginning with English and Hindi while allowing additional North East Indian languages without business-logic rewrites.

## In scope

- Route every patient-facing string through `react-i18next` or equivalent localization service. No UI/business-logic hardcoded copy.
- Store preferred and fallback language in the patient profile; use explicit selection or verified language identification before speech processing.
- Support English and Hindi across the complete available path: UI, speech input, intent processing, response, and TTS. Add an extensible locale registry for Assamese, Meitei, Bengali, and future reviewed locales.
- Provide reviewed translations for SOS, medicine acknowledgement, and other safety-critical copy. Track translation version/reviewer metadata.
- Use Sarvam AI online where the complete configured language path is supported; use brief pre-recorded/on-device fallback where it is not.

## Constraints

Do not claim support for a locale unless STT → intent → TTS works for that deployment configuration. Do not assume food, religion, household roles, or routines; caregiver schedules are configurable. On an unavailable language, explicitly use the configured fallback and keep the response short.

## Acceptance criteria

Representative English and Hindi UI, text-intent, and voice-path tests pass. A locale addition requires only translation/content and provider-capability configuration, not changes to reminder/game/safety business rules. Safety-copy review evidence is stored with releases.

---

# Iteration 9 — Integration and Hardening

## Goal

Make the completed system safe, resilient, and demonstrably consistent. Do not add major product scope.

## In scope

- Execute automated and manual end-to-end journeys for patient, caregiver, and SOS flows exactly as listed in the brief.
- Verify offline mode, reconnect/sync behavior, idempotent retries, missing data, late API responses, incomplete game sessions, unavailable STT/TTS, missing location, duplicate events, and ambiguous voice commands.
- Implement/verify secure sync: client IDs, idempotent upsert semantics on `/sync/push`, timestamped `/sync/pull`, conflict policy, and safe retry behavior.
- Enforce role authorization server-side; never trust model output or client claims for medication, game score, identity, location, SOS, or caregiver permissions.
- Minimize data sent to voice/LLM services; redact unnecessary identifiers and location details.
- Conduct accessibility, performance, audit-log, and release-readiness reviews.

## Release gates

1. Patient local games/reminder interactions remain usable with no connectivity.
2. Reconnect cannot duplicate sessions, reminders, location events, or SOS records.
3. An unlinked caregiver cannot retrieve any patient record or location.
4. Medication state remains unconfirmed unless an explicit valid confirmation exists.
5. Safety workflows are deterministic, logged, authorized, and tested end-to-end.
6. No product text implies diagnosis, disease progression, or medical advice.

## Final deliverables

- Test report with pass/fail evidence for each end-to-end and failure-mode scenario.
- Traceability matrix mapping every release gate to tests.
- Known-limitations register, including supported voice languages and offline command limitations.
- Deployment/runbook documentation for secrets, Sarvam AI proxy, WebSocket/in-app alert delivery, and (once provisioned) FCM/SMS fallback, monitoring, incident handling, and rollback.
