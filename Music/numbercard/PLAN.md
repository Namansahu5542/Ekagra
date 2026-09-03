# Number Garden Plan

## Product goal
Number Garden is a calm, mobile-first calculation game for people living with dementia. It uses short, repeatable rounds, generous touch targets, plain language, no punitive countdown, optional hints, and positive feedback.

## Risk slices
1. **Question flow** — mixed arithmetic and sequence questions, three answer choices, feedback, round completion.
2. **Session measurement** — elapsed round time, per-question response time, accuracy, hints, streak, and a browser-local history.
3. **Joyful interaction** — animated garden backdrop, robin guide, gentle answer feedback, reduced-motion support, and pause/read-aloud controls.
4. **Responsive layout** — large text and touch targets that remain usable on a phone-sized viewport.

## Verification criteria
- User can start a round in mixed mode or select addition, subtraction, multiplication, division, or sequences.
- User can answer every question with a single tap/click and immediately sees friendly feedback.
- User can pause, ask for a hint, and read the prompt aloud without losing place.
- Summary clearly shows time taken, accuracy, correct answers, average response time, hints used, and each question's result.
- Summary persists the latest round in localStorage and shows a compact recent-history view.
- `pnpm check` and `pnpm build` pass.
- `?demo` auto-starts a deterministic round for visual verification.

## Design decisions
- Use React for the interface and Babylon.js for a lightweight animated ambient garden canvas.
- Use generated art assets as the visual anchor and robin guide; large interface labels are rendered in HTML for accessibility.
- Keep gameplay rules in `client/src/game/game.ts` and Babylon setup in `client/src/game/scene.ts`.
