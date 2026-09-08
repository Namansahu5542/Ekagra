# Ekagra — dementia-friendly UI/UX redesign

This is a **separate working copy** of the `under_maintainance` archive. The original
files were copied unchanged and then redesigned here; nothing in the original branch
was touched. Suggested branch name when you merge this in: `redesign/dementia-calm-violet`.

No behaviour, data flow, routing, games logic, i18n keys, or `testID` values were changed.
Every edit is presentational.

## Palette

Violet / lavender base, with a natural green and a soft butter-cream as gentle warm supplements.

| Role | Value |
|------|-------|
| Page canvas | `#f7f4fb` |
| Surface | `#ffffff` |
| Soft lavender surface | `#ece5f7` / `#ddd2ee` |
| Primary | `#5b3f9d` |
| Primary deep / focus ring | `#45307a` |
| Strong text | `#2c2140` |
| Body text | `#463c5c` |
| Muted text | `#655c78` |
| Success / done | `#166534` on `#f1fcf3`, border `#709b79` |
| Warm highlight | `#fffbce`, text `#6b5310` |
| Alert | `#a4262c` on `#fdecec` |

All legacy token names (`emberOrange`, `peachBlush`, `warmCanvas`, …) are kept as aliases in
`frontend/src/theme.ts`, so no screen had to be rewritten to keep working.

## What changed

- **Tokens** (`frontend/src/theme.ts`) — new palette, roomier spacing scale, larger type scale
  (18 / 21 / 23 / 26 / 32 / 40), softer radii, whisper-soft elevation, and motion tokens.
- **Touch targets** — minimum 48pt, primary actions 68pt, tiles 176pt tall.
- **Components** (`frontend/src/components/UI.tsx`) — rebuilt `AppText`, `Screen`, `Header`,
  `Card`, `BigButton`, `Tile`, `StatusPill`; added `PageTitle`, `SectionLabel`, `Reassurance`.
  Added accessibility roles, labels and hints throughout. Content is capped at a 720pt reading
  measure so lines stay easy to track on tablets and desktop.
- **Back button** now reads "Back" next to the chevron — an icon is never used alone.
- **Motion** (`frontend/src/lib/motion.ts`) — `useReducedMotion`, `useEntrance` (gentle fade and
  lift), `usePressScale` (soft settle on tap). All of them collapse to no movement when the
  person has "reduce motion" switched on; the web shell also honours
  `prefers-reduced-motion` in CSS.
- **Home** — clearer orientation block (greeting, full date, large clock, connection status),
  one prominent "What to do now" card as the single primary task, then four large activity tiles.
- **Activities hub** — each activity carries its own gentle wash (lavender, butter, mint) so it
  can be recognised by colour as well as name and icon.
- **Web shell** (`frontend/app/+html.tsx`) — pinch-zoom re-enabled (`maximum-scale` removed),
  visible high-contrast focus ring, reduced-motion media query, matching theme colour.

## Verified

- TypeScript passes with no errors.
- Sign-in, Home and Activities screens render correctly in Expo web with no console errors.
