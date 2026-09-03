# Whack a Ball — Build Plan

## Goal

Ship a touch-friendly, single-screen color-reaction game with a 45-second run, four target colors, positive/negative scoring, a visible target prompt, and a detailed end-of-run results view.

## Risk slices

1. **Babylon interaction slice:** orthographic board layout must resize correctly and mesh picking must work on mouse and touch.
2. **State slice:** target changes, ball lifetimes, score, streaks, misses, and color-level statistics must remain consistent when a ball is hit or expires.
3. **Responsive UI slice:** ready, playing, and finished states must stay legible at desktop and mobile viewport widths.
4. **Runtime asset slice:** generated visual direction is referenced as a low-opacity board texture without blocking gameplay or creating a local large-asset deployment problem.

## Scoring model

| Event | Score change |
| --- | ---: |
| Hit the requested color | +2 |
| Hit another color | -1 |
| Let a ball disappear | 0 |

Accuracy is correct taps divided by attempted taps. Misses are reported separately and do not affect the score.

## Verification criteria

- The ready screen explains the objective and scoring model.
- Pressing “Start the run” begins a timed session and updates the target color.
- Visible balls can be tapped/clicked; correct and incorrect hits update score and streak.
- The timer ends the run and the results screen shows score, grade, accuracy, hit counts, wrong hits, best streak, and per-color breakdown.
- `pnpm check` and `pnpm build` pass.
- Desktop and mobile screenshots show the intended layout without clipped controls.
