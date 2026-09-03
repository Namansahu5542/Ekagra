# Assets

**Art direction:** Premium playful arcade-night rendering: a dark indigo starfield, warm coral-orange rounded board, deep plum holes, glossy red/blue/green/yellow balls, restrained UI glassmorphism, and bright coral/gold accents.

| Asset | Source | Runtime use |
| --- | --- | --- |
| `whack-a-ball-board.png` | Generated with Manus built-in image generation | Low-opacity Babylon background texture; storage path `/manus-storage/whack-a-ball-board_3042d378.png`. |
| Color balls | Babylon procedural spheres | Live interactive red, blue, green, and yellow targets. |
| Board, holes, rims, stars | Babylon procedural meshes/materials | Playfield and ambient decoration. |

The generated image is stored outside the project at `/home/ubuntu/webdev-static-assets/whack-a-ball-board.png` and referenced from WebDev storage to avoid bundling a large local file.
