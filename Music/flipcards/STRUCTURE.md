# Structure

The app is intentionally single-screen and local-first.

- `app/(tabs)/index.tsx`: game UI, board state, scoring, persistence, and mobile interaction.
- `assets/images/northeast-culture.png`: supplied user reference image used on card faces.
- `assets/images/card-back.png`: generated indigo, coral, and gold woven pattern used on card backs.
- `theme.config.js`: palette tokens for the app shell.

The game state is framework-light React state. A card has an id, pair key, title, label, and revealed/matched flags. A move is recorded when two cards are checked. Score is derived from completed actions rather than arbitrary UI values.
