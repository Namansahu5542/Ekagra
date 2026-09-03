# Whack a Ball — Runtime Structure

The app uses React as the UI shell and Babylon.js as the interactive playfield. `GameCanvas.tsx` owns lifecycle-safe engine setup and renders HUD/results overlays, while `scene.ts` owns gameplay state and Babylon meshes.

| Module | Responsibility |
| --- | --- |
| `client/src/game/scene.ts` | Framework-agnostic game state, timer, target selection, scoring, ball spawning/expiry, mesh picking, resize layout, and subscriptions. |
| `client/src/components/GameCanvas.tsx` | React/Babylon lifecycle, responsive HUD, ready instructions, score rules, live target prompt, and results report. |
| `client/src/index.css` | Arcade visual system, responsive breakpoints, motion, typography, and touch-sized controls. |
| `client/index.html` | Document metadata and display/body font loading. |

The game has explicit `ready`, `playing`, and `finished` modes. The scene exports a `GameHandle` with `start`, `hitBall`, `subscribe`, `getSnapshot`, and `dispose` so UI state stays separate from Babylon internals.
