---
name: CCL
description: Documentation for a configuration language that reads like plain text.
colors:
  accent: "#774bc1"
  accent-high: "#ccc1eb"
  accent-low: "#271d3d"
  contrast: "#f5b13d"
  contrast-high: "#ffc966"
  on-accent: "#fbf7ff"
  ink-dark: "#fde4ff"
  bg-dark: "#2c0031"
  accent-light: "#6030a5"
  accent-high-light: "#382659"
  accent-low-light: "#d9d1f1"
  contrast-light: "#a85f00"
  contrast-high-light: "#8a4f00"
  ink-light: "#2c0031"
  bg-light: "#ffffff"
typography:
  display:
    fontFamily: "Afacad Flux Variable, Source Sans 3, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 3.75rem)"
    fontWeight: 780
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Afacad Flux Variable, Source Sans 3, sans-serif"
    fontWeight: 780
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  code:
    fontFamily: "Fira Code, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontFeature: "'ss01','ss02','ss03','ss04','ss05','ss06','zero','onum'"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  section: "clamp(4.5rem, 9vw, 7rem)"
  block: "clamp(1rem, 3vw, 2rem)"
  inline: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.contrast-high}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  panel:
    backgroundColor: "{colors.accent-low}"
    rounded: "{rounded.md}"
    padding: "{spacing.block}"
---

## Overview

**The Readable Config.** CCL is a configuration language whose whole pitch is that it reads like plain text — everything is `key = value`, indentation makes hierarchy. The documentation is designed to feel the same way: calm, low-ceremony, and immediately legible. Purple is the ink; a warm amber is the highlighter you reach for when something matters. The mood is **simple, cool, fun** — approachable enough for someone learning the syntax, exact enough for someone writing a conformant parser.

This is a **product** register: design serves the reading experience. What it is *not*: corporate/enterprise SaaS heaviness, sterile academic spec-document dryness, or anything so playful it undercuts credibility with implementers. Personality comes through restraint, warmth of voice, and small deliberate touches — not visual noise.

Built on Astro + Starlight. The system layers on top of Starlight's tokens by overriding the `--sl-color-*` ramp, so it inherits Starlight's responsive shell, sidebar, and a11y defaults while carrying a distinct purple identity. Layout is fluid: sections and blocks are sized with `clamp()` rather than fixed breakpoints wherever possible.

## Colors

A **committed** purple identity with a single warm accent for contrast. The palette is defined twice — a dark theme and a light theme — by remapping Starlight's grayscale ramp to purple hues, so "gray" text is actually tinted purple in both modes.

- **Accent (purple)** — `#774bc1` dark / `#6030a5` light. The brand ink: links, primary buttons, active states, the accent rail on the landing page. `accent-low` (`#271d3d` / `#d9d1f1`) is the tonal surface for panels and callouts; `accent-high` is the raised text/border tone.
- **Contrast (warm amber)** — `#f5b13d` / `#ffc966` in dark, deliberately darkened to `#a85f00` / `#8a4f00` in light to hold contrast against pale backgrounds. Used *sparingly* as emphasis against the purple: the landing rail node, secondary-button text, focus rings. It is the highlighter, never the body.
- **On-accent** — `#fbf7ff`, a near-white fixed light color for text sitting on the purple accent. Kept explicit because Starlight flips `--sl-color-white` to dark text in light mode, which would fail on the purple.
- **Ink / Background** — near-white purple-tinted ink (`#fde4ff`) on deep aubergine (`#2c0031`) in dark mode; deep aubergine ink on white in light mode.

Contrast discipline: body text and placeholders target ≥4.5:1, large text ≥3:1, in both themes. The amber is intentionally shifted darker in light mode for exactly this reason — never place light amber as text on a pale surface.

## Typography

Two families on a clear contrast axis, plus a distinctive code face — no near-duplicate pairings.

- **Display / headings** — **Afacad Flux Variable** at weight 780 with `-0.02em` tracking. Used for `h1`–`h4` and the landing hero. Tight, confident, a little characterful — the "cool/fun" note. Hero display caps around `clamp(2.5rem, 6vw, 3.75rem)`, well under the shouting ceiling.
- **Body** — **Source Sans 3** (`--sl-font`), regular weight, line-height ~1.6. Neutral, highly legible humanist sans for prose. Measure follows Starlight's content column (~65–75ch).
- **Code** — **Fira Code Variable** with stylistic sets and oldstyle/zero features enabled (`ss01`–`ss06`, `zero`, `onum`). Code is core content here (CCL examples everywhere), so the code face is a first-class part of the identity, ligatures and all.

Use `text-wrap: balance` on headings and `text-wrap: pretty` on long prose.

## Elevation

**Flat and tonal, not shadowed.** The system uses no drop shadows. Depth is expressed through tonal layering — `accent-low` surfaces, 1px tinted borders, and `color-mix()` tints (e.g. `contrast 12%`) — rather than elevation. The landing page's vertical accent rail (a 1px gradient line with a glowing amber node built from layered `box-shadow` rings) is the one deliberate exception, and there the shadow is a *glow* effect, not a card lift. When adding surfaces, prefer a tonal background step or a border over a shadow.

## Components

- **Buttons** (`LandingButton.astro`) — fully rounded pills (`999px`), `min-height: 44px` (touch target), weight 600. *Primary* is solid purple accent with `on-accent` text; *secondary* is transparent with amber text and a soft amber border. Hover lifts `translateY(-2px)` and lightens via `color-mix`; focus shows a 2px amber `outline` at `3px` offset. All motion is guarded by `prefers-reduced-motion`.
- **Panels / callouts** — `accent-low` tonal surface, `12px` radius, 1px tinted border, fluid `clamp()` padding. No nested cards.
- **Code blocks** — Expressive Code with a custom CCL TextMate grammar; Fira Code with ligatures/stylistic sets. Treated as the primary content affordance, not a decorative aside.
- **Motion** — ease-out-expo curves (`cubic-bezier(0.16, 1, 0.3, 1)`), ~0.18s transitions, small `translateY` lifts. Intentional and subtle; every animated component ships a reduced-motion fallback.

Radii scale: `sm 6px` (inline chips, small elements), `md 12px` (panels, cards), `lg 16px` (large containers), `pill 999px` (buttons, tags).

## Do's and Don'ts

- **Do** let the docs feel like the language: minimal, readable, low-ceremony. Simplicity is the product; demonstrate it.
- **Do** lead with real CCL examples and side-by-side comparisons (show, don't tell).
- **Do** keep purple as the ink and amber as a rare highlighter. If amber is carrying more than ~10% of a surface, it's overused.
- **Do** verify contrast in *both* themes, especially amber — it must go darker in light mode.
- **Do** serve both audiences: friendly learning path and exact implementer reference, both first-class.
- **Don't** use drop shadows for depth — reach for tonal `accent-low` surfaces and tinted borders instead.
- **Don't** add corporate SaaS chrome, dense marketing gloss, or spec-document dryness.
- **Don't** pair the display face with another characterful sans; the Afacad Flux ↔ Source Sans contrast is the system.
- **Don't** place light amber as text on pale backgrounds, or nest cards.
- **Don't** animate without a `prefers-reduced-motion` alternative.
