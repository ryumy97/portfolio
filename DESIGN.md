---
version: alpha
name: Ryumy
description: >-
  Personal web portfolio by In Ha Ryu. Editorial 10-column gallery on warm
  paper, Playfair Display + Lato, coral signal, cobalt links, WebGL as spatial
  punctuation.
colors:
  primary: "#F75D5D"
  on-primary: "#F9F8F5"
  secondary: "#1255CB"
  on-secondary: "#F9F8F5"
  neutral: "#F9F8F5"
  on-surface: "#1E1E1E"
  muted: "#F5F5F5"
  muted-foreground: "#595959"
  error: "#E40014"
  border: "#E5E5E5"
  ring: "#A1A1A1"
  overlay: "#000000"
typography:
  headline-display:
    fontFamily: Playfair Display
    fontSize: 6rem
    fontWeight: 700
    lineHeight: 0.8
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 5rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 0.8
    letterSpacing: -0.03em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Lato
    fontSize: 1.5rem
    fontWeight: 400
    lineHeight: 1.25
  body-md:
    fontFamily: Lato
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.25
  body-sm:
    fontFamily: Lato
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: Lato
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25
  label-md:
    fontFamily: Lato
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25
  label-sm:
    fontFamily: Lato
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.05em
  label-link:
    fontFamily: Lato
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.25
rounded:
  none: 0px
  sm: 0.375rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.875rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 8px
  margin: 32px
  catalog-gap: 80px
  columns: 10
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 10px
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, #F75D5D 80%, transparent)"
    textColor: "{colors.on-surface}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 10px
  button-ghost:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 10px
  button-destructive:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.error}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 10px
  button-nav:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: 8px
  pointer:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    height: 12px
    width: 12px
  link:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-link}"
  title:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
  project-title:
    backgroundColor: "{colors.on-primary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-lg}"
  body:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  caption:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
  lab-label:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label-sm}"
  slider-track:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.on-surface}"
    height: 4px
    rounded: "{rounded.full}"
  slider-range:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    height: 4px
    rounded: "{rounded.full}"
  dialog:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: 16px
  header:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
  footer:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
  loader:
    backgroundColor: "{colors.overlay}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
  bullet:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.full}"
    height: 8px
    width: 8px
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.ring}"
    textColor: "{colors.on-surface}"
---

# Design System: Ryumy

Extracted from the live portfolio at [ryumy.com](https://www.ryumy.com/) (In Ha Ryu). YAML tokens are normative. Prose explains atmosphere, roles, and application. Use the descriptive name in prompts; keep the hex for precision.

**Dials:** Creativity `9` (editorial serif, kinetic type). Density `4` (gallery-airy frames; lab 3D scenes carry the weight). Variance `8` (10-column offset, horizontal catalogs, no centered hero). Motion Intent `8` (infinite marquee, morphing cursor, clip-reveals).

## Overview

A **warm, editorial gallery** — closer to a well-lit sculpture hall than a product dashboard. The canvas is Gallery Ivory (`#F9F8F5`). Type is Gallery Ink (`#1E1E1E`). The only brand pulse is **Coral Signal** (`#F75D5D`): the custom cursor, active nav, page titles, CV dates, hero punctuation, and the full-bleed footer. **Cobalt Link** (`#1255CB`) is reserved for hyperlinks and 8px project bullets — never for primary fills.

The site is a Next.js portfolio with shadcn **radix-nova** chrome, but the personality is not Nova-neutral. Headlines are **Playfair Display Bold**, body is **Lato**. Layout is a strict **10-column CSS Grid** with subgrid nesting. Home is currently an empty ivory field (header only). About, Projects, and Gallery are **horizontal** catalogs. Lab is a vertical index that opens into full-bleed WebGL experiments.

Depth comes from **WebGL and Three.js**, not drop shadows. UI chrome stays flush: hairline rings, a 12px coral pointer that morphs into underlines and pills, and a black intro overlay that wipes away through a gradient canvas.

**Key characteristics:**

- Warm ivory paper, never cool gray and never pure white as the page
- Coral as the single accent; cobalt only on links and bullets
- Playfair Display for display; Lato for everything else (including “mono” labels)
- 10 equal columns; viewport-fluid type (`clamp` via `min(max(vw, min), max)`)
- Custom cursor on fine pointers; hidden on touch
- Horizontal scroll for catalogs; vertical scroll for Home and Lab
- 3D as spatial punctuation, not a background wallpaper

**Motion (implement in code; static mocks will not animate):** Default ease is `cubic-bezier(0.3, 0, 0, 1)` (`ease-default`). Hero type rises with `circOut` (0.5s delay, 1s duration) then marquee-scrolls forever. The pointer lerps toward its target with a ~0.1s time constant. Project images clip-reveal from center and parallax on the scroll axis. Mobile menu expands to full viewport in 0.6s; items stagger in 0.2–0.6s. Buttons press 1px downward. Animate `transform` and `opacity` only.

## Colors

Two chromatic signals on a warm neutral field. Coral is the brand. Cobalt is navigation-of-meaning (URLs, project bullets). Everything else is zinc-neutral.

**Light (the live default)**

- **Primary / Coral Signal (`#F75D5D`):** Cursor fill, active nav, page titles, CV dates, hero commas/periods, slider range, footer field. The single accent.
- **On-primary / Gallery Ivory (`#F9F8F5`):** Type on the black intro overlay; inverse type when a coral pill sits behind nav (hover). Same hex as the page canvas.
- **Secondary / Cobalt Link (`#1255CB`):** Italic links, project-entry bullets (8px circles), award list underlines. Not a second CTA fill.
- **On-secondary / Gallery Ivory (`#F9F8F5`):** Type on a cobalt fill, if a filled secondary control is needed.
- **Neutral / Gallery Ivory (`#F9F8F5`):** Page, header, popover, dialog, and card canvas. Warm paper, not `#FFFFFF`.
- **On-surface / Gallery Ink (`#1E1E1E`):** Body, nav, Playfair headlines. Off-black — never pure `#000000` for text.
- **Muted / Mist Well (`#F5F5F5`):** Slider tracks, ghost-hover wells, compact chrome fills.
- **Muted-foreground / Steel Caption (`#595959`):** Lab helper copy and uppercase control-group labels. Live compiled gray is `#737373` (~4.46:1 on ivory); use `#595959` for AA on reading-size captions.
- **Error / Alert Crimson (`#E40014`):** Destructive / invalid. Not a brand substitute for Coral Signal.
- **Border / Whisper Border (`#E5E5E5`):** Lab sidebar rule, input strokes, structural 1px lines.
- **Ring / Fog Ring (`#A1A1A1`):** Focus rings at 50% opacity (`ring-3` / `ring-ring/50`). Keyboard presence without a neon halo.
- **Hairline Ink Ring (`rgba(30, 30, 30, 0.10)`):** Dialog outline (`ring-1 ring-foreground/10`).
- **Overlay / Night Stage (`#000000`):** Intro loader only. Do not use for body text or page chrome.

**Coral on ivory is ~3:1.** That pair is legal for *display* type (hero, 8vw mobile menu, 30vw 404) and for non-text fills (cursor, footer). Compact filled controls pair **Gallery Ink on Coral Signal** so chrome stays AA. Compact *text* on paper uses Ink or Cobalt — not 14px coral.

**Dark** exists in the token file (Nova invert: Night Canvas `#0A0A0A`, pale primary, no coral) but the live site ships light. Do not invent a second coral-on-night palette. If dark is required, keep Coral Signal for the cursor and titles; do not flatten primary to gray.

**Accent rule:** Maximum one fill accent — Coral Signal. Cobalt is link-only. No purple, no neon, no third brand hue.

**Banned colors:** Pure white (`#FFFFFF`) as the page canvas; cool blue-gray surfaces; purple / violet “AI” gradients; oversaturated marketing greens as CTAs; mixing warm ivory with a cool gray page in one view.

## Typography

Two families, loaded from Google Fonts: **Playfair Display** (variable 400–900, used at 700) for display; **Lato** (400 and 700) for body, UI, and the so-called mono labels. `--font-mono` *is* Lato — there is no actual monospace face. Hierarchy is weight, optical size, and Coral Signal — not a third family.

Fluid sizes use `min(max({vw}, {px-min}), {px-max})`. YAML stores the desktop max (or the characteristic size). Scale down on small viewports; never drop reading body below 14px.

- **Display (`headline-display`):** Playfair Bold, ~15vw mobile / 7vw desktop, leading 0.8, tracking −0.03em. 404 uses the same family at 30vw, Coral Signal, leading-none.
- **Project titles (`headline-lg`):** Playfair Bold, 32–80px, leading 1.25, tracking −0.03em. Sit over images on a translucent ivory wash (`bg-white/80`).
- **Page titles (`headline-md`):** Playfair Bold, 18–32px, leading 0.8, tracking −0.03em. The first line is often Coral Signal (“About”, “Projects”, “Gallery”, “Lab”); the second line, if any, is Ink (“In Ha Ryu”).
- **Section titles (`headline-sm`):** Playfair Bold, ~20–28px. CV headings, lab category titles (coral), lab experiment titles (28px Ink).
- **Lead (`body-lg`):** Lato Regular, 14–24px, leading 1.25. Page descriptions.
- **Body (`body-md`):** Lato Regular, 16px, leading 1.25. Default reading.
- **Compact lists (`body-sm`):** Lato Regular, 12–13px, leading 1.5. CV bullets.
- **Nav / buttons (`label-lg`, `label-md`):** Lato Medium, 14px. Nav is `text-[max(min(1.1vw,10px),14px)]` — effectively 14px. Buttons are 0.875rem.
- **Lab kickers (`label-sm`):** Lato, 12px, uppercase, tracking 0.05em (`tracking-wider`), Steel Caption.
- **Links (`label-link`):** Lato italic, 12–13px, Cobalt Link. Underline on mobile (`a { max-md:underline }`). Desktop underlines are the morphing coral pointer, not a CSS underline.

**Banned fonts:** Inter; Geist; generic system UI stacks as the voice of the site; generic book serifs (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`). Playfair Display is the only serif, and only for display.

## Layout

A **fixed 10-column grid** (`grid-cols-10`), full viewport, equal tracks. Nested regions use CSS **subgrid** (`grid-cols-subgrid col-span-full`). No 12-column bootstrap, no `max-w-6xl` marketing column. Home content pads 8px (`px-2`); catalogs pad 32px (`px-8`). Body is `overflow-hidden`; scrolling is Lenis.

- **Header:** Fixed, `z-50`, 8px padding, 10 columns. Logo in column 1. Desktop links right-weighted: About col 7, Projects col 8, Gallery col 9, Lab col 10. Mobile: Menu in col 10; a full-viewport ivory overlay with Playfair 8vw links.
- **Home:** Empty ivory field. Header is the wayfinding. Use `svh`, never `h-screen` / `100vh`.
- **Background canvas:** Root layout. Always a foreground WebGL overlay (`fixed`, `h-svh`, `z-40`, `pointer-events-none`). Header `z-50`, pointer `z-[60]`, content `z-10`. The document `body` holds the page field color. First paint is Gallery Ink (`#1E1E1E`). Each route has one color (`usePageColor` `current`; `previous` is the field you are leaving): Home Ivory (`#F9F8F5`), About Cobalt (`#1255CB`), Projects Coral, Gallery Ink, Lab Cobalt. Route updates are instant. Discs start from the pathname change, over the `body` field (the canvas itself is unfilled). First load hides page content until that fly-in finishes (Ink field, destination-colored discs, then the page). After that, visible page content stays on the previous route until the fly-in finishes; then discs are cleared, `body` becomes the destination color, and the new page is shown. `prefers-reduced-motion` skips the animation and reveals immediately.
- **Catalogs (About / Projects / Gallery):** Horizontal Lenis. A row of `w-max` items, vertically centered, gap 10vw mobile / 5vw desktop. About intro is ~20–50vw; CV cards ~30vw. Project stills 80vw / 30vw with 40vw / 30vw trailing margin so images can sit behind titles.
- **Lab index:** Vertical Lenis. Content in cols 2–10. Category titles coral Playfair; experiment names Ink Playfair in a 5-col (mobile) / 1-col-per-item (desktop) subgrid.
- **Lab experiment:** Sidebar cols 1–3 (Back, title, description, controls) with a right hairline; canvas cols 3–11. On small screens the sidebar is an overlay that translates in; a coral Menu button toggles it.
- **Footer:** Catalogs have no site footer. The coral kiwi field is retired until a new home treatment needs it.
- **Touch:** Collapse the 10-col header to logo + Menu below 768px. Catalogs stay horizontal — they are the mobile pattern, not a failure. Minimum tap targets 44px on Menu and lab chrome; nav text can stay compact because the coral pointer expands the hit on desktop.

**Responsive:** `md` = 768px. Multi-column lab lists collapse. No accidental horizontal overflow on Home/Lab. Headlines scale with vw; body stays ≥14px. Images use `sizes` (`50vw` / `30vw` list; `120vw` / `60vw` desktop stills; `60vw` / `20vw` mobile stills).

## Elevation & Depth

The page is **flat**. Hierarchy is scale, coral, and 3D occupancy.

- No drop shadow on cards, headers, or nav.
- Dialogs: Hairline Ink Ring, 14px corners, 16px padding, 100ms fade/zoom. Overlay is `bg-black/10` with `backdrop-blur-xs`.
- Project titles: translucent ivory (`bg-white/80`) so type stays readable on photography.
- Intro: Night Stage (`#000000`) at `z-50`, then a WebGL gradient canvas wipes it. Percentage type uses `drop-shadow-md` while loading.
- Custom cursor: 12px Coral Signal circle, `z-0`, offset `-top-4 -left-4`. On hover it morphs — **bg** (pill behind the target +16px), **underline** (1px rule under type), **bullet** (12px circle), **hide** (sliders). Touch pointers (`pointer: touch`) get no cursor.
- Toasts / sheets are Nova leftovers; the live IA does not rely on them. Prefer the pointer for feedback.

## Shapes

**Softly rounded chrome, circular signals.** Base radius is 10px (`0.625rem` / `rounded.lg`). Scale: 6px (`sm`), 8px (`md`), 10px (`lg`) for buttons and nav, 14px (`xl`) for dialogs. The pointer, slider thumbs (12px), project bullets (8px), and footer kiwi are **full-pill / circle**.

Do not mix sharp cards with rounded buttons in the same view. Do not use pill-shaped primary buttons — those are the cursor’s job.

## Components

### Buttons

Softly rounded (10px). Compact height 32px default; large 36px; extra-small 24px. 1px downward press. Focus: Fog Ring at 50% opacity. No outer glow, no custom OS cursor (the coral pointer *is* the cursor).

- **Primary:** Coral Signal fill with Gallery Ink type for compact chrome. Hover eases to 80% coral. Large coral fields (footer) may invert to ivory.
- **Secondary:** Cobalt fill with Gallery Ivory. Rare; prefer italic cobalt links.
- **Ghost:** Ivory until hover (Mist Well). Used for Lab “Back”.
- **Destructive:** Alert Crimson type on ivory — never a solid red brick.
- **Nav / navActive:** Transparent, 14px Lato. Default is Ink; the current route is Coral Signal. Hover: the coral pointer expands behind the word and type flips to Gallery Ivory (`hover:text-background`). Logo hover also slides in a 28px mark (300ms rotate from −180°).

### Pointer

The signature control. 12px coral circle that lerps to the pointer, then to a target rect. Types: `bg`, `underline`, `bullet`, `hide`. Desktop only. Do not add a second custom cursor, trailing particles, or a blend-mode invert cursor.

### Links and lists

Italic Cobalt Link at 12–13px. CV lists: disc → circle → square, indented. Project entries on About get an 8px cobalt bullet at the left edge. Awards lists may underline in cobalt. Mobile: native underlines on `a`.

### Cards / catalogs

There is no generic card component on the marketing surfaces. A “card” is a ~30vw column of type, or a still that clip-reveals. Titles overlay images; they are not boxed. Lab is a typographic index, not a three-equal-card grid.

### Inputs / lab controls

Label above. Lab group labels are uppercase Steel Caption. Sliders: 4px Mist track (`slider-track`), Coral range (`slider-range`), 12px white thumb with Fog Ring; the pointer hides while dragging. Dialogs: 14px corners, hairline ring, 16px padding.

### Navigation

Fixed 10-col header. Identity: “Ryumy” as a nav button, coral when on `/`. Routes: About, Projects, Gallery, Lab. Mobile menu: full-viewport ivory, Playfair 8vw, active route in coral, 0.6s height ease. Do not invent a hamburger icon for desktop.

### Feedback

Lab canvases may show their own WebGL. Skeletons are not the voice of this site. Empty states should be composed (type + one recovery), not “No data found”. 404: 30vw coral Playfair with a recovery link.

### Data and media

Photography is full-bleed, object-cover, blur placeholders, eager where it is the catalog hero. 3D (Gaussian splats, particle labs) sits in demand-framed canvases in Lab. Do not put 3D in a card with a drop shadow.

## Do's and Don'ts

**Do**

- Use Coral Signal for the cursor, active route, page-title kicker, dates, and one large field (footer / 404)
- Use Cobalt Link for URLs, italic captions, and 8px bullets
- Name colors with the descriptive name and hex (Coral Signal (`#F75D5D`))
- Keep the 10-column grid and subgrid nesting
- Use `min-h-[100svh]` / `100svh` for full-height frames
- Pair Playfair Bold display with Lato body
- Let catalogs scroll horizontally; let Home and Lab scroll vertically
- Morph the coral pointer instead of adding CSS underlines on desktop
- Prompt new screens with: “Warm Gallery Ivory paper, Playfair Display bold headlines with −0.03em tracking, Lato body, Coral Signal cursor and titles, Cobalt italic links, 10-column grid, hairline not shadow, WebGL as spatial punctuation”

**Don't**

- Inter, Geist, or a second serif
- Pure white page canvas or pure black body text
- A second fill accent (keep coral as the only one)
- Centered marketing heroes or three-equal-card feature rows
- Drop shadows on UI chrome
- Neon glows, purple gradients, or glassmorphism stacks
- A custom OS cursor *plus* the coral pointer
- `h-screen` / `100vh`
- `space-y-*` / `space-x-*` (use `gap`)
- Emojis in UI, code, or alt text
- AI copy clichés: “Elevate”, “Seamless”, “Unleash”, “Next-Gen”
- Invented metrics or “by the numbers” dashboards
- Generic names: “John Doe”, “Acme”, “Nexus”
- Replacing Playfair with a “safer” sans for headlines
