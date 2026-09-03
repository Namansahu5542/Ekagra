import { Platform } from "react-native";

// Design tokens sourced from DESIGN.md (dementia-friendly patient app)
export const colors = {
  emberOrange: "#ff3c00",
  sunsetCoral: "#ff764c",
  peachBlush: "#ffb199",
  burntRust: "#ec4e02",
  electricBlue: "#2492ff",
  warmCanvas: "#faf6f1",
  pureWhite: "#ffffff",
  inkBlack: "#0e0e0f",
  charcoal: "#312e2e",
  slate: "#36373b",
  stone: "#898c94",
  pewter: "#52545a",
  warmGray: "#76716f",
  sand: "#dfddd8",
  driftwood: "#cbc7c3",
  fog: "#efefef",
  success: "#1b7a3d",
  successBg: "#e4f5ea",
  danger: "#c62828",
  dangerBg: "#fdeaea",
};

export const space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  badge: 10,
  nav: 14,
  input: 14,
  button: 14,
  card: 16,
};

// Patient-mode type scale (min 18pt). See DESIGN.md.
export const type = {
  helper: 18,
  body: 20,
  action: 22,
  cardTitle: 24,
  heading: 30,
  title: 36,
};

// Atkinson Hyperlegible / Noto Sans loaded via app/+html.tsx on web.
export const fontFamily = Platform.select({
  web: "'Atkinson Hyperlegible', 'Noto Sans', system-ui, Arial, sans-serif",
  default: undefined as unknown as string,
});

export const touch = {
  min: 48,
  primary: 64,
};
