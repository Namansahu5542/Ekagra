# Whack a Ball — Build Memory

- Project scaffold: WebDev `web-static`; frontend-only implementation.
- Visual direction: “arcade night” with indigo background, orange play board, luminous color balls, and restrained glass HUD cards.
- Babylon uses an orthographic FreeCamera so the board reads consistently across aspect ratios.
- The generated board image is intentionally low-opacity in the scene: it supplies texture and art direction while leaving the live meshes and hit targets crisp.
- Mobile controls rely on Babylon pointer picking and the canvas has `touch-action: none` to avoid browser gesture interference during play.
- `?demo` starts the run after a short delay so browser screenshots can show the live state.
