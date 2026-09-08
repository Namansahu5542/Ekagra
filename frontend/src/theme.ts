import { Platform } from "react-native";

/**
 * Dementia-friendly design tokens.
 *
 * Base palette: calm violet / lavender.
 * Supplements: a natural deep green for "done / safe" states and a soft
 * butter-cream for gentle warmth and highlights.
 *
 * All text pairings below meet WCAG 2.2 AA, and body copy on the canvas and
 * surface colours meets AAA. Legacy token names from the previous orange
 * system are kept as aliases so no screen breaks.
 */

const palette = {
  // Violet base
  violet: "#5b3f9d",
  violetDeep: "#45307a",
  violetInk: "#2c2140",
  lavender: "#ddd2ee",
  lavenderSoft: "#ece5f7",
  lavenderMist: "#f7f4fb",

  // Natural green (confirmation, safety, progress)
  green: "#166534",
  greenSoft: "#709b79",
  greenMist: "#f1fcf3",

  // Warm supplements
  butter: "#fffbce",
  butterInk: "#6b5310",
  clay: "#b0603a",

  // Neutrals, warmed very slightly so nothing feels clinical
  white: "#ffffff",
  ink: "#241c33",
  body: "#463c5c",
  muted: "#655c78",
  line: "#dcd3ea",
  lineSoft: "#ebe5f3",
  fogWarm: "#f2eff6",

  // Alerts
  red: "#a4262c",
  redMist: "#fdecec",
};

export const colors = {
  // ---- Semantic tokens (preferred) ----
  canvas: palette.lavenderMist,
  surface: palette.white,
  surfaceMuted: palette.lavenderSoft,
  surfaceLavender: palette.lavender,
  surfaceWarm: palette.butter,
  surfaceGreen: palette.greenMist,

  primary: palette.violet,
  primaryDeep: palette.violetDeep,
  primarySoft: palette.lavender,
  onPrimary: palette.white,

  textStrong: palette.violetInk,
  text: palette.body,
  textMuted: palette.muted,
  onWarm: palette.butterInk,

  border: palette.line,
  borderSoft: palette.lineSoft,
  borderStrong: palette.violet,

  accentWarm: palette.clay,

  focus: palette.violetDeep,
  overlay: "rgba(36, 28, 51, 0.55)",

  // ---- Status ----
  success: palette.green,
  successBg: palette.greenMist,
  successBorder: palette.greenSoft,
  danger: palette.red,
  dangerBg: palette.redMist,
  warning: palette.butterInk,
  warningBg: palette.butter,

  // ---- Legacy aliases (kept so existing screens keep working) ----
  emberOrange: palette.violet,
  sunsetCoral: palette.violetDeep,
  peachBlush: palette.lavender,
  burntRust: palette.violetDeep,
  electricBlue: palette.violet,
  warmCanvas: palette.lavenderMist,
  pureWhite: palette.white,
  inkBlack: palette.violetInk,
  charcoal: palette.violetDeep,
  slate: palette.body,
  stone: palette.muted,
  pewter: palette.muted,
  warmGray: palette.muted,
  sand: palette.line,
  driftwood: palette.line,
  fog: palette.fogWarm,
  gunmetal: palette.body,
  mist: palette.muted,
  deepCharcoal: palette.violetInk,
};

/** Generous, calm rhythm. Roomier than the previous scale. */
export const space = {
  xs: 8,
  sm: 14,
  md: 20,
  lg: 28,
  xl: 40,
  xxl: 56,
};

/** Soft, friendly corners — nothing sharp or clinical. */
export const radii = {
  badge: 999,
  nav: 20,
  input: 18,
  button: 20,
  card: 24,
  panel: 32,
};

/** Patient-mode type scale. Nothing below 18pt. */
export const type = {
  helper: 18,
  body: 21,
  action: 23,
  cardTitle: 26,
  heading: 32,
  title: 40,
};

export const lineHeight = {
  heading: 1.25,
  body: 1.5,
};

/** Atkinson Hyperlegible / Noto Sans loaded via app/+html.tsx on web. */
export const fontFamily = Platform.select({
  web: "'Atkinson Hyperlegible', 'Noto Sans', system-ui, Arial, sans-serif",
  default: undefined as unknown as string,
});

export const touch = {
  min: 48,
  primary: 68,
  large: 84,
};

/** Very soft, low-contrast lifts. Depth should whisper, never shout. */
export const elevation = {
  card: {
    shadowColor: palette.violetInk,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  raised: {
    shadowColor: palette.violetInk,
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

/**
 * Motion tokens. Slow and gentle by design; every animation must be
 * skipped when the person has asked for reduced motion.
 */
export const motion = {
  fast: 160,
  base: 260,
  slow: 420,
  pressScale: 0.975,
  pressOpacity: 0.92,
};
