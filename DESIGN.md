# Dementia-Friendly Patient App — Design Reference
> calm, familiar, reassuring, and easy to understand at a glance

**Theme:** light, high contrast, low cognitive load

This system is for the patient-facing mobile experience of an AI-based cognitive gaming and memory-assistance app for older adults living with dementia. It prioritizes comprehension, recognition, confidence, safety, and low cognitive effort over visual novelty or density. Caregiver dashboards may be more compact, but all patient-mode screens follow this guide.

## Core Principles

1. **One clear action at a time.** Each screen has one primary task and no competing calls to action.
2. **Recognition over recall.** Pair important labels with familiar icons, imagery, or optional speech. Icons are never used alone.
3. **Calm and predictable.** Keep navigation, button placement, wording, and task order consistent. No hidden gestures or auto-advancing screens.
4. **Readable at arm’s length.** Use large text, generous line-height, plain language, and short sentences.
5. **Safe by default.** Keep emergency help visible, confirm consequential actions, and make recovery from mistakes obvious.
6. **Respectful and adult.** Use warm, direct wording; avoid childish visuals, patronizing language, pressure, or medical performance judgments.

## Patient-Mode Accessibility Baseline

- Meet WCAG 2.2 AA contrast at minimum; target AAA for normal patient-facing text.
- Use 48 × 48dp minimum targets; primary actions should be 60–64dp high.
- Do not communicate state with color, sound, gesture, or an icon alone—include a text label.
- Support system font scaling without clipping, overlap, or horizontal scrolling.
- Localize all patient-facing strings through `react-i18next` for Assamese, Manipuri, Hindi, Bengali, and English.
- Every feature must work offline unless it explicitly needs connectivity.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ember Orange | `#ff3c00` | `--color-ember-orange` | Primary CTAs, active nav indicators, brand accents, interactive icon strokes — vivid saturated orange that makes every action feel switched on |
| Sunset Coral | `#ff764c` | `--color-sunset-coral` | Feature card backgrounds, decorative gradient fills, secondary accent surfaces |
| Peach Blush | `#ffb199` | `--color-peach-blush` | Soft feature card backgrounds, heading accents, warm wash fills for highlighted sections |
| Burnt Rust | `#ec4e02` | `--color-burnt-rust` | Orange outline accent for tags, dividers, and focused UI edges. Do not promote it to the primary CTA color |
| Electric Blue | `#2492ff` | `--color-electric-blue` | Secondary nav highlight, link emphasis — used sparingly for differentiation from orange |
| Warm Canvas | `#faf6f1` | `--color-warm-canvas` | Primary page background, nav surface, card resting surface — the dominant warm cream that defines the system |
| Pure White | `#ffffff` | `--color-pure-white` | Card surface, input fields, button text, elevated content blocks — the brightest surface layer |
| Ink Black | `#0e0e0f` | `--color-ink-black` | Primary text, dominant borders, strong structural strokes — the workhorse near-black |
| Charcoal | `#312e2e` | `--color-charcoal` | Card borders, secondary text, button borders — warm dark gray for structure |
| Slate | `#36373b` | `--color-slate` | Nav borders, heading borders, body text emphasis |
| Deep Charcoal | `#1a1919` | `--color-deep-charcoal` | Dark surface text, card dark-mode text, button borders |
| Gunmetal | `#2f3034` | `--color-gunmetal` | Icon borders, input borders, secondary button strokes |
| Stone | `#898c94` | `--color-stone` | Muted borders, tertiary text, icon fills, decorative structure lines |
| Pewter | `#52545a` | `--color-pewter` | Body text, secondary paragraph copy |
| Warm Gray | `#76716f` | `--color-warm-gray` | Link borders, helper text, tertiary descriptive copy |
| Mist | `#61646b` | `--color-mist` | Subtle body borders, very low-emphasis text |
| Sand | `#dfddd8` | `--color-sand` | Light card backgrounds, soft dividers, warm-tinted borders |
| Driftwood | `#cbc7c3` | `--color-driftwood` | Card borders, subtle background fills — warm light neutral |
| Fog | `#efefef` | `--color-fog` | Alternate surface background, subtle wash fills |

## Tokens — Typography

### Patient Typeface — Use a highly legible sans-serif for all patient-facing UI. · `--font-patient`
- **Preferred:** Atkinson Hyperlegible; use Noto Sans for broad Indic-language coverage
- **Fallback:** Arial, system-ui, sans-serif
- **Weights:** 400, 500, 600, 700 only
- **Sizes:** 18, 20, 22, 24, 30, 36
- **Line height:** 1.25 for headings, 1.5 for body copy
- **Role:** All patient-mode copy, controls, labels, and headings. Never use condensed, thin, italic, script, all-caps, or negatively tracked text.

### ABC Diatype Plus Variable — Primary typeface for all headings, display text, and body. The variable version provides the full range from whisper-light to bold. Display sizes (48-69px) use heavy negative tracking (-0.04 to -0.06em) creating tight, confident headlines. Body and UI text settles at 14-18px with weight 400-500. The signature use of weights 400-500 for large display text (rather than 700-800) gives Replit's type a modern, editorial confidence — authority through precision, not volume. · `--font-abc-diatype-plus-variable`
- **Substitute:** Inter, Geist, or DM Sans
- **Weights:** 400, 500, 600, 700
- **Sizes:** 8, 10, 11, 12, 14, 15, 16, 17, 18, 20, 24, 26, 28, 32, 42, 48, 60, 64, 69
- **Line height:** 0.80, 0.83, 0.89, 1.00, 1.05, 1.10, 1.20, 1.40, 1.60
- **Letter spacing:** -0.06em at 69px, -0.05em at 64px, -0.04em at 48px, -0.03em at 32px, -0.02em at 20px, -0.01em at 14px, normal at 12px and below
- **Role:** Primary typeface for all headings, display text, and body. The variable version provides the full range from whisper-light to bold. Display sizes (48-69px) use heavy negative tracking (-0.04 to -0.06em) creating tight, confident headlines. Body and UI text settles at 14-18px with weight 400-500. The signature use of weights 400-500 for large display text (rather than 700-800) gives Replit's type a modern, editorial confidence — authority through precision, not volume.

### IBM Plex Sans — IBM Plex Sans — detected in extracted data but not described by AI · `--font-ibm-plex-sans`
- **Weights:** 400
- **Sizes:** 14px
- **Line height:** 1, 1.2, 1.57
- **Role:** IBM Plex Sans — detected in extracted data but not described by AI

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| helper / minimum | 18px | 1.5 | normal | `--text-helper` |
| body | 20px | 1.5 | normal | `--text-body` |
| button / nav | 22px | 1.25 | normal | `--text-action` |
| card title | 24px | 1.3 | normal | `--text-card-title` |
| heading | 30px | 1.25 | normal | `--text-heading` |
| screen title | 36px | 1.2 | normal | `--text-title` |

## Tokens — Spacing & Shapes

**Base unit:** 8px

**Density:** spacious; use 24px screen/card padding, 16px minimum control gaps, and 32px section gaps

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 60 | 60px | `--spacing-60` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 120 | 120px | `--spacing-120` |

### Border Radius

| Element | Value |
|---------|-------|
| nav | 14px |
| cards | 16px |
| badges | 10px |
| inputs | 14px |
| buttons | 14px |

### Layout

- **Page max-width:** 1200px
- **Section gap:** 80px
- **Card padding:** 24px minimum
- **Element gap:** 16px minimum
- **Patient screen maximum:** four choices; one-column layout for important decisions

## Components

### Primary CTA Button (Pill)
**Role:** Main action trigger — sign up, get started, create

Use one primary action per screen. Full-width where practical; 60–64dp minimum height, 14px border-radius, high-contrast blue (#075E9E) background, white 22px semibold text, and 24px horizontal padding. Include a familiar leading icon only alongside a text label. Pressed state: #034A7A; focus state: 3px #0B74C7 outline. Use direct labels such as “Start game”, “Hear this again”, or “Call my family”.

### Secondary Outline Button (Pill)
**Role:** Secondary action — log in, learn more

White background, 2px #075E9E border, #075E9E 22px semibold text, 60dp minimum height, and 14px border-radius. Use for explicit safe alternatives such as “Go back”, “Not now”, and “Show me again”; never make an important alternative text-only or tiny.

### Nav Item
**Role:** Top navigation links

Use a persistent bottom bar with at most four destinations: Home, Activities, My day, and Help. Each item has a familiar icon plus a 20px text label. The active state uses a blue border/background and a text-visible state—never color alone. Avoid hamburger menus, nested menus, swipe-only navigation, and unlabeled icons.

### Feature Bento Card (Peach Gradient)
**Role:** Large feature showcase cards in bento grid layout

Oversized rounded card, 40-60px border-radius, #ffb199 or #ff764c background fill, 32px padding. Contains a small eyebrow label (14px weight 500 #312e2e), large heading (32-48px weight 400, tight tracking), and description paragraph (14-16px). Cards can be 2-3 column widths in a bento grid.

### Category Icon Button
**Role:** Project type selector in hero prompt area

Vertical pill: icon (24px outlined) stacked above label text (13px weight 500). No background, #0e0e0f color. 12px gap between icon and label. hovers with #ff3c00 icon stroke.

### Prompt Input Bar
**Role:** Hero AI prompt input — the centerpiece action

Large rounded input, 16-20px border-radius, white (#ffffff) background, 1px #dfddd8 border, 16-20px padding. Placeholder text in #898c94. Embedded coral circular submit button (40px diameter) at right edge with #ff3c00 fill. Full-width within container, 48-56px height.

### Trust Logo Strip
**Role:** Social proof / customer logos

Horizontal row of partner/company logos, evenly spaced with 24-32px gaps. Logos rendered in #76716f or #898c94 grayscale. No borders or background — sits directly on canvas.

### Tagline Eyebrow
**Role:** Small descriptor above headings

13-14px weight 500, #76716f or #52545a color, normal tracking. Used as supporting copy above display headlines.

### Display Headline
**Role:** Hero and section titles

ABC Diatype Plus Variable 48-69px weight 400-500, #0e0e0f or #1a1919 color, heavy negative letter-spacing (-0.04 to -0.06em), line-height 0.85-1.00. The restrained weight paired with tight tracking creates editorial authority.

### Dark Preview Card
**Role:** Code/product preview frames in dark mode

Rounded card, 20-40px radius, #1a1919 or #0e0e0f dark background, containing a code editor or product UI mockup. Creates visual contrast against the warm cream canvas.

### Nav Badge
**Role:** Notification/announcement indicator on nav items

Small pill, #ff3c00 background, white text, 12px weight 500, 4px 8px padding, 6px border-radius. Indicates new or hot items.

### Agent Number Display
**Role:** Branded "Agent 4" text treatment

Large inline text where the number/version is in #ff3c00 while the word is in #0e0e0f. 42-48px weight 400, tight tracking. Creates the signature "Meet Agent 4" hero treatment.

## Do's and Don'ts

### Dementia-Specific Requirements (Patient Mode)

- Keep an **Emergency Help** control visible on the home screen and every active task screen. It uses red (`#B42318`), a clear emergency icon, and the text label “Emergency Help”; it must not be hidden in a menu.
- For reminders, show one reminder at a time with a large relevant image/icon, plain-language title, and three clear responses: **Done**, **Remind me later**, and **I need help**. Offer a visible **Hear this reminder** control. Do not auto-dismiss or use a countdown.
- For games, explain the goal in one sentence and offer **Hear instructions**. Show one task at a time, remove time limits by default, and always provide **Pause**, **Home**, **Skip**, and **Help** without penalty.
- Pair spoken guidance with the same written wording and a visible **Hear again** button. Audio is optional: all tasks remain usable without speech recognition or sound.
- Use familiar, culturally appropriate local photographs or clear object illustrations. Never place text over imagery, use carousels, flashing content, autoplay video, confetti, or decorative gradients behind text.
- Give gentle feedback: “Well done. You finished the activity.” or “Let’s try that again.” Never show failure labels, decline messages, score comparisons, harsh vibrations, or red error screens.
- Ask location permission in plain language, explain why it helps, and avoid showing complex maps or tracking detail in patient mode.

### Do
- Use #ff3c00 exclusively for primary actions, active states, and brand emphasis — never for body text or large backgrounds
- Use #075E9E for patient-mode primary actions and reserve #B42318 only for Emergency Help and urgent safety states
- Set patient-mode headings at 30-36px with normal letter spacing; set body text at 20px and controls at 22px
- Use visibly bounded 14px-radius buttons and 16px-radius cards rather than ambiguous pill controls
- Ground every page on #faf6f1 warm canvas — white (#ffffff) is reserved for cards and inputs that need to lift off the cream
- Use 40-60px border-radius for feature/hero cards and 20px for standard content cards
- Let the warm peach/coral gradient cards (#ffb199 → #ff764c) be the visual exclamation points — surround them with monochrome calm
- Keep line-heights tight on display text (0.85-1.05) and generous on body copy (1.38-1.60)

### Don't
- Don't use blue (#2492ff) for CTAs — orange #ff3c00 owns primary action; blue is only for secondary nav differentiation
- Don't use sharp corners on cards or buttons — the system is defined by generous rounding (minimum 6px, typically 20-100px)
- Don't use heavy drop shadows — the system relies on borders and surface contrast, not elevation shadows
- Don't set display text in weight 700+ — the signature is 400-500 with tight tracking, not bold weight
- Don't use pure #ffffff for page backgrounds — #faf6f1 warm cream is the canvas; white is only for elevated cards
- Don't place more than 2-3 peach/coral cards per viewport — they should punctuate, not dominate
- Don't use #000000 as text color — use #0e0e0f or #1a1919 to keep the warm temperature of the neutrals
- Don't use patient-facing text below 18px, negative tracking, small close icons, hover-only states, drag-and-drop, double tap, or hidden gestures
- Don't make the user remember a prior instruction, rely on an icon/color/sound alone, or auto-advance/dismiss an important screen

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Warm Canvas | `#faf6f1` | Primary page background — the permanent warm cream stage |
| 2 | Card White | `#ffffff` | Standard card surface, input fields, elevated content blocks |
| 3 | Sand Wash | `#dfddd8` | Alternate light surface for subtle section differentiation |
| 4 | Peach Feature | `#ffb199` | Feature card backgrounds — visual exclamation points |
| 5 | Coral Feature | `#ff764c` | High-energy feature card backgrounds for key bento sections |
| 6 | Dark Preview | `#1a1919` | Dark code/product preview cards that contrast against the warm canvas |

## Elevation

This system intentionally avoids drop shadows. Structure is communicated through border hairlines (1px in #dfddd8, #312e2, or #898c94) and surface color contrast. The warm cream canvas, white cards, and peach feature surfaces create depth through temperature and chroma shifts rather than shadow. This keeps the interface feeling flat, fast, and modern — like a well-lit workspace rather than a skeuomorphic panel system.

## Imagery

Imagery is minimal and product-focused. The system relies on dark code editor preview cards (#1a1919) embedded as showcase elements within the warm cream layout. Logo strips for social proof are rendered in muted gray (#76716b-#898c94), never in brand color. No lifestyle photography, no decorative illustrations — the visual interest comes from typographic scale, the warm/neutral surface palette, and the peach gradient feature cards. Icons throughout are thin-stroke outlined style, monochrome (black or orange depending on context), 1.5px apparent stroke weight.

## Agent Prompt Guide

**Quick Color Reference**
- Text: #0e0e0f (primary), #52545a (body), #76716f (muted)
- Background: #faf6f1 (canvas), #ffffff (cards), #ffb199/#ff764c (feature cards)
- Border: #dfddd8 (light), #312e2e (medium), #0e0e0f (strong)
- Accent: #ff3c00 (primary action)
- primary action: #ff3c00 (filled action)

**3-5 Example Component Prompts**

1. **Hero Display Headline**: 64px ABC Diatype Plus Variable weight 400, #0e0e0f, letter-spacing -0.05em, line-height 0.90. Centered on #faf6f1 canvas.

2. **Primary CTA Pill Button**: #ff3c00 background, white text, 14px weight 500, 10px 20px padding, 100px border-radius. hovers to #ec4e02.

3. **Peach Feature Card**: 40px border-radius, #ffb199 background, 32px padding. Eyebrow label 13px weight 500 #312e2e, heading 32px weight 400 #0e0e0f, letter-spacing -0.03em. Description 16px #52545a.

4. **Prompt Input Bar**: Full-width, 56px height, 20px border-radius, #ffffff background, 1px #dfddd8 border. Placeholder #898c94. Embedded #ff3c00 circular submit button (44px diameter) at right edge.

5. **Trust Logo Strip**: Horizontal flex row, 32px gaps, logos in #898c94 grayscale, vertically centered, no borders or background container.

## Similar Brands

- **Linear** — Same pill-button geometry, border-driven elevation (no shadows), and confident oversized display type with tight tracking
- **Vercel** — Similar clean monochrome base with single vivid accent color, generous whitespace, and developer-focused restraint
- **Notion** — Warm neutral background tones, playful rounded geometry, and a creator-friendly approachable feel
- **Cursor** — AI-tool visual language with prominent prompt input as hero element, clean typography, and minimal decoration
- **Framer** — Bento card grid layouts with warm accent colors, large display headlines, and creator/builder audience targeting

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-ember-orange: #ff3c00;
  --color-sunset-coral: #ff764c;
  --color-peach-blush: #ffb199;
  --color-burnt-rust: #ec4e02;
  --color-electric-blue: #2492ff;
  --color-warm-canvas: #faf6f1;
  --color-pure-white: #ffffff;
  --color-ink-black: #0e0e0f;
  --color-charcoal: #312e2e;
  --color-slate: #36373b;
  --color-deep-charcoal: #1a1919;
  --color-gunmetal: #2f3034;
  --color-stone: #898c94;
  --color-pewter: #52545a;
  --color-warm-gray: #76716f;
  --color-mist: #61646b;
  --color-sand: #dfddd8;
  --color-driftwood: #cbc7c3;
  --color-fog: #efefef;

  /* Typography — Font Families */
  --font-abc-diatype: 'ABC Diatype', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-abc-diatype-plus-variable: 'ABC Diatype Plus Variable', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-ibm-plex-sans: 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 18px;
  --leading-caption: 1.5;
  --tracking-caption: 0;
  --text-body: 20px;
  --leading-body: 1.5;
  --tracking-body: 0;
  --text-subheading: 22px;
  --leading-subheading: 1.25;
  --tracking-subheading: 0;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: 0;
  --text-heading: 30px;
  --leading-heading: 1.25;
  --tracking-heading: 0;
  --text-heading-lg: 36px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: 0;
  --text-display: 36px;
  --leading-display: 1.2;
  --tracking-display: 0;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 32px;
  --element-gap: 12px;

  /* Border Radius */
  --radius-md: 6px;
  --radius-2xl: 16px;
  --radius-2xl-2: 20px;
  --radius-3xl: 24px;
  --radius-3xl-2: 40px;
  --radius-3xl-3: 46px;
  --radius-full: 56px;
  --radius-full-2: 60px;
  --radius-full-3: 70px;
  --radius-full-4: 90px;
  --radius-full-5: 100px;
  --radius-full-6: 999px;
  --radius-full-7: 1028px;

  /* Named Radii */
  --radius-nav: 6px;
  --radius-cards: 40px;
  --radius-badges: 6px;
  --radius-inputs: 6px;
  --radius-buttons: 100px;

  /* Surfaces */
  --surface-warm-canvas: #faf6f1;
  --surface-card-white: #ffffff;
  --surface-sand-wash: #dfddd8;
  --surface-peach-feature: #ffb199;
  --surface-coral-feature: #ff764c;
  --surface-dark-preview: #1a1919;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-ember-orange: #ff3c00;
  --color-sunset-coral: #ff764c;
  --color-peach-blush: #ffb199;
  --color-burnt-rust: #ec4e02;
  --color-electric-blue: #2492ff;
  --color-warm-canvas: #faf6f1;
  --color-pure-white: #ffffff;
  --color-ink-black: #0e0e0f;
  --color-charcoal: #312e2e;
  --color-slate: #36373b;
  --color-deep-charcoal: #1a1919;
  --color-gunmetal: #2f3034;
  --color-stone: #898c94;
  --color-pewter: #52545a;
  --color-warm-gray: #76716f;
  --color-mist: #61646b;
  --color-sand: #dfddd8;
  --color-driftwood: #cbc7c3;
  --color-fog: #efefef;

  /* Typography */
  --font-abc-diatype: 'ABC Diatype', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-abc-diatype-plus-variable: 'ABC Diatype Plus Variable', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-ibm-plex-sans: 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 18px;
  --leading-caption: 1.5;
  --tracking-caption: 0;
  --text-body: 20px;
  --leading-body: 1.5;
  --tracking-body: 0;
  --text-subheading: 22px;
  --leading-subheading: 1.25;
  --tracking-subheading: 0;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: 0;
  --text-heading: 30px;
  --leading-heading: 1.25;
  --tracking-heading: 0;
  --text-heading-lg: 36px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: 0;
  --text-display: 36px;
  --leading-display: 1.2;
  --tracking-display: 0;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;

  /* Border Radius */
  --radius-md: 6px;
  --radius-2xl: 16px;
  --radius-2xl-2: 20px;
  --radius-3xl: 24px;
  --radius-3xl-2: 40px;
  --radius-3xl-3: 46px;
  --radius-full: 56px;
  --radius-full-2: 60px;
  --radius-full-3: 70px;
  --radius-full-4: 90px;
  --radius-full-5: 100px;
  --radius-full-6: 999px;
  --radius-full-7: 1028px;
}
```
