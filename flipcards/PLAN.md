# Memory Match Build Plan

## Goal
Build a mobile-first flip-card memory game themed around northeastern Indian culture using the supplied reference image and a generated woven card-back asset.

## Risk slices
1. Flip-card interaction: prevent more than two active cards, lock input while resolving, and keep matched cards visible.
2. Score integrity: calculate score only from completed gameplay data (pairs, moves, elapsed seconds, accuracy, streak), then persist best score locally.
3. Mobile layout: keep a readable 4x4 board inside portrait safe areas with no tab bar overlap.
4. Completion flow: present a clear results summary and allow a clean new game.

## Verification criteria
- All 16 cards render and are pressable on a narrow portrait viewport.
- Cards visibly transition between patterned backs and culture-themed fronts.
- A pair match remains face-up; a mismatch flips back after feedback delay.
- Timer, move count, live score, accuracy, and streak update deterministically.
- Completion screen shows the exact score breakdown and a New game action.
- Best score persists locally when storage is available.
