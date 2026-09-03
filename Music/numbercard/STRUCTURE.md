# Number Garden Structure

- `client/src/App.tsx` — app shell and route.
- `client/src/pages/Home.tsx` — accessible game interface, level selection, play state, summary, local history.
- `client/src/game/game.ts` — framework-agnostic question bank, round state, timing, scoring, and hint rules.
- `client/src/game/scene.ts` — Babylon.js ambient garden canvas with floating firefly/leaf meshes and lifecycle-safe cleanup.
- `client/src/components/GameCanvas.tsx` — React/Babylon lifecycle boundary.
- `client/src/index.css` — visual system, responsive layout, animation, reduced-motion rules.

Gameplay is intentionally UI-light: every action is large, labeled, and reachable by touch or keyboard. The game never relies on color alone for correctness feedback.
