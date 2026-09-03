# Content structure and UX review

Review of [ryumy.com](https://www.ryumy.com/) as implemented in this repo. Scope is information architecture, content inventory, and interaction — not visual-token compliance (see `DESIGN.md`).

**Dials the site already commits to:** Creativity 9, Density 4, Variance 8, Motion Intent 8. Findings below treat those as constraints, not bugs. Horizontal catalogs, hidden home labels, and a coral pointer are intentional. The issues are where that model leaks, duplicates, or dead-ends.

---

## 1. What the site is for

A visitor should leave with three things: who In Ha Ryu is, what the work looks like, and that the practice is WebGL / 3D / editorial frontend.

Those jobs are split across four public surfaces:

| Job | Surface | Format |
| --- | --- | --- |
| Identity and credentials | `/about` | Horizontal CV catalog |
| Work, seen | `/projects` | Horizontal stills catalog |
| Practice, played | `/lab` | Vertical index → full-bleed experiment |
| Photography | `/gallery` | Year index → horizontal stills |
| Wayfinding / atmosphere | `/` | Vertical: kinetic type, then a 3D figure |

Header (About / Projects / Gallery / Lab) is the reliable path. Home is a spatial index, not a content page.

---

## 2. Site map

```mermaid
flowchart TB
  subgraph chrome [Always on]
    Header["Header: Ryumy · About · Projects · Gallery · Lab"]
    Pointer["Coral pointer — desktop"]
    Loader["Intro loader — first visit"]
  end

  Home["/  Home"]
  About["/about  CV catalog"]
  Projects["/projects  stills catalog"]
  Gallery["/gallery  year index"]
  Lab["/lab  experiment index"]
  NF["/404"]
  Blogs["/blogs  unpublished stub"]

  Header --> Home
  Header --> About
  Header --> Projects
  Header --> Gallery
  Header --> Lab

  Home -->|"figure: head"| About
  Home -->|"figure: hand"| Projects
  Home -->|"figure: eye"| Gallery
  Home -->|"figure: phone"| Lab
  Home --> Footer["Coral footer — no links"]

  About --> PReflct["/projects/reflct"]
  About --> PType["/projects/typography"]
  About --> PKiwi["/projects/kiwi"]
  About --> PAim["/projects/aimhigh"]
  About --> PFola["/projects/fola"]
  About --> PGreen["/projects/greenprint"]
  About --> PWater["/projects/real-watergate"]
  About --> PHeritage["/projects/heritage-new-zealand"]
  About --> ExtVault["vault.ryumy.com"]
  About --> ExtHerd["fantasyherd.co.nz"]

  Projects --> PReflct
  Projects --> PType
  Projects --> PKiwi
  Projects --> PAim
  Projects --> PFola
  Projects --> PGreen
  Projects --> PWater
  Projects --> PHeritage
  Projects --> PFeast["/projects/feast-mode"]

  Gallery --> G2025["/gallery/2025"]

  Lab --> LabExp["20 experiments"]
  LabExp -->|"Back"| Lab
```

`/blogs` is routed but not in the header, home figure, or About. It is a horizontal strip of red placeholders. Treat it as dead inventory until it has content or is removed.

---

## 3. Content architecture

Two catalogs describe the same person with different jobs. About is the CV. Projects is the lookbook. Lab is not a third portfolio — it is a sketchbook.

```mermaid
flowchart LR
  subgraph aboutCat [About — credentials]
    Identity["Name, Auckland, contact, CV.pdf"]
    Personal["Personal: Reflct, Typography, Kiwi, Aim High, Vault"]
    Experience["McCann → awards · Infosys · Perpetual Guardian"]
    Education["BE Computer Systems, 2016–2021"]
    Skills["Frontend · Backend · Testing · Others"]
  end

  subgraph projectsCat [Projects — stills]
    LookPersonal["Personal stills: Reflct, Typography, Kiwi, Aim High"]
    LookWork["Client stills: FOLA, Greenprint, Watergate, Heritage, Feast Mode"]
  end

  subgraph labCat [Lab — experiments]
    GS["Gaussian Splatting"]
    Three["Three.js scene + post"]
    Shaders["WebGL shaders"]
    Canvas2d["2D canvas"]
  end

  Identity --> Personal --> Experience --> Education --> Skills
  LookPersonal --- LookWork
  GS --- Three --- Shaders --- Canvas2d

  Personal -.->|"cobalt bullet"| LookPersonal
  Experience -.->|"award titles"| LookWork
```

### Overlap (the actual content bug)

Work that exists in one catalog but not the other:

```mermaid
flowchart TB
  subgraph both [In About and Projects]
    A1[Reflct]
    A2[Typography]
    A3[Kiwi]
    A4[Aim High]
    A5[FOLA]
    A6[Greenprint]
    A7[Real Watergate]
    A8[Heritage NZ]
  end

  subgraph aboutOnly [About only]
    B1["Vault — live URL, no case study"]
    B2["Correct the internet — awards, no URL, no case study"]
    B3["Fantasy Herd — external URL only"]
  end

  subgraph projectsOnly [Projects only]
    C1["Feast Mode — full case study, not on the CV"]
  end
```

That split is the main structural problem. A recruiter on About never sees Feast Mode. A visitor on Projects never sees Vault, Correct the internet, or the award weight of Fantasy Herd. The two surfaces do not share a source of truth; each page hard-codes its own list.

---

## 4. Session flows

### First visit

```mermaid
sequenceDiagram
  participant V as Visitor
  participant L as Intro loader
  participant H as Home
  participant N as Header
  participant C as Catalog

  V->>L: Land on any URL
  L->>L: Night Stage + % until R3F progress 100
  L->>L: 2s gradient wipe
  L->>H: Home if path is /
  Note over H: Kinetic "Cogito, ergo sum."<br/>then 3D figure
  alt Desktop
    V->>H: Hover mesh part — label fades in
    V->>C: Click About / Projects / Gallery / Lab
  else Mobile or impatient
    V->>N: Menu / nav links
    V->>C: Catalog or Lab index
  end
```

The loader is global (`components/loader.tsx` + `stores/intro.ts`). It keys off `@react-three/drei` `useProgress`, so the first paint of the whole site waits on 3D assets even if the visitor deep-linked to `/about`. There is no `prefers-reduced-motion` branch.

### Catalog reading

```mermaid
stateDiagram-v2
  [*] --> Vertical: Home, Lab index
  [*] --> Horizontal: About, Projects, Gallery, project pages

  Vertical --> EndMark: Home footer kiwi
  Horizontal --> Hint: "Scroll this way" pinned bottom-right

  Horizontal --> CaseStudy: Click title / still
  CaseStudy --> Horizontal: Header back to /projects
  LabIndex --> Experiment: Click name
  Experiment --> LabIndex: Sidebar Back
```

Once inside a project page there is no next/previous, no “more projects”, and no crumb. The only exit is the header. Lab experiments are better: sidebar **Back** returns to `/lab`.

---

## 5. Surface-by-surface UX

### Home `/`

Vertical Lenis. Hero is full `svh` kinetic type over Rodin. The figure is the sitemap: head → About, hand → Projects, eye → Gallery, phone → Lab.

**Works:** Matches the design brief (spatial punctuation, not a centered hero). Header duplicates the four destinations, so the figure can stay cryptic.

**Friction:** On desktop the labels are `opacity-0` until hover. The hit targets are vw-sized boxes on mesh parts — poetic, easy to miss. Mobile shows labels always, which is the correct fallback. The coral footer is brand, not navigation: it eases to 10% coral and rolls a kiwi. No contact, no CV, no secondary links.

### About `/about`

Horizontal CV. Intro column (name, maxim, Auckland, GitHub, LinkedIn, phone, email, CV.pdf) then section rules: Personal | Experience | Education | Skills.

**Works:** Dates in Coral Signal. Personal titles with cobalt 8px bullets go to case studies. Awards that have pages are cobalt-underlined. Skills are body copy under Playfair headings, not fake bullets.

**Friction:**

- The strip is long. There is no in-page jump to Experience / Skills. “Scroll this way” is the only progress cue; native scrollbars are hidden behind Lenis + `overflow-hidden`.
- Vault is a live product with no case study and no cobalt bullet.
- Correct the internet is the most awarded line on the CV and is not a link.
- Email is rendered as `INHA.RYU.97@GMAIL.COM`.
- Award footnotes (`*Cannes Lions 2024` …) are CV-faithful but sit in a ~30vw column after a dense nested list.

### Projects `/projects` and case studies

Same horizontal machine as About, with clip-reveal stills and Playfair titles on `bg-white/80`.

Order today: Reflct → Typography → Kiwi → Aim High → FOLA → Greenprint → Real Watergate → Heritage NZ → Feast Mode. That is neither chronological nor “personal then client” in a labelled way. A visitor cannot tell agency work from personal work until they open a page (`- Personal · 2024` vs `- DDB NZ`).

Case studies are a repeating pattern: title + live URL → text / stills → Links column. Strength varies. Reflct and Feast Mode are rich. Aim High and Heritage are thin (few stills, short copy). There is no role line (“Senior frontend, McCann”) on client pages except the DDB kicker.

### Gallery `/gallery`

One year (`2025`) then a Vault-backed stills strip. As a primary nav item equal to Projects and Lab, it is thin. Fine as a side room; odd as 25% of the header.

### Lab `/lab` and experiments

Best internal IA on the site. Categories (coral Playfair) → optional subheads (Steel Caption) → experiment names (Ink Playfair). Vertical scroll. Experiments use a 10-column shell: sidebar cols 1–3 (Back, title, description, controls), canvas the rest. Mobile sidebar is an overlay; a coral control toggles it.

**Friction:** Header uses the word “Menu”; lab chrome uses a hamburger icon. DESIGN.md asked for word Menu on the site chrome and 44px taps — the icon control is smaller and less consistent. `LabLink` draws a CSS underline on hover (`h-0.5 w-0 group-hover:w-full`) while the rest of desktop uses the coral pointer instead of CSS underlines.

### 404

30vw coral Playfair over a 3D field. The type wrapper is `pointer-events-none`. There is no “Home” or “Lab” recovery. Beautiful, incomplete.

---

## 6. Cross-cutting UX

```mermaid
flowchart TB
  subgraph intended [Intentional]
    I1[Horizontal catalogs]
    I2[Custom coral pointer]
    I3[Page tunnel on route change]
    I4[Lenis, no native bars]
    I5[10-column grid]
  end

  subgraph cost [Cost of the model]
    C1[No scrollbar = progress is opaque]
    C2[Catalog position is not in the URL]
    C3[Deep links skip spatial Home]
    C4[Keyboard / reduced motion not designed]
    C5[Touch loses the pointer language]
  end

  I1 --> C1
  I1 --> C2
  I3 --> C3
  I2 --> C5
  I4 --> C4
```

- **Orientation** is taught once (“Scroll this way”) and then assumed. Fine for a short Projects strip; weak for About.
- **Wayfinding after a case study** depends entirely on the header. Lab solved this with Back; projects did not.
- **Motion** is the personality. Without a reduced-motion path, the intro wipe, marquee, and tunnel are unavoidable.
- **Touch:** catalogs stay horizontal (correct per DESIGN.md). The coral pointer hides. Mobile underlines on `a` pick up the slack. Home labels stay visible. This is the one place the site already designs the fallback.
- **Unpublished `/blogs`** will 200 if guessed or crawled. It does not match the design system (raw red blocks).

---

## 7. Findings, ordered

**P1 — Catalogs disagree.** About and Projects should be two views of one list. Today Feast Mode, Vault, Correct the internet, and Fantasy Herd fall through the cracks. Pick a rule (e.g. “if it has stills it is in Projects; if it is on the CV it is in About; work with stills must appear in both”) and enforce it.

**P2 — About has no internal navigation.** Personal → Experience → Education → Skills is a single unnamed axis. A short coral jump list (or section markers that the pointer can hit) would keep density 4 without making Skills a secret.

**P3 — Home desktop labels are hover-only.** Keep the mystery, but give a persistent cue (one visible label, or a faint “hover the figure”) so the spatial map is learnable. Header already saves the task; the figure should teach, not hide.

**P4 — Case studies are dead ends.** Add Back to `/projects` (mirror Lab) and optional prev/next. Header-only exit feels like leaving the building.

**P5 — 404 and `/blogs`.** 404 needs a recovery link. `/blogs` should 404 or stay unrouted until it is a real surface.

**P6 — Secondary, still worth doing.**

- Show role / year / personal-vs-client on the Projects strip, not only inside the case study.
- Link or explicitly mark Correct the internet; decide Vault’s case-study status.
- Sentence-case the email.
- Align lab Menu with header copy; drop the CSS underline on lab names in favour of the pointer.
- `prefers-reduced-motion`: skip loader wipe and marquee, or shorten them.
- Gallery as a header peer is disproportionate until there is more than one year.

---

## 8. Recommended IA (not a redesign)

Keep four header destinations. Make the content graph explicit:

```mermaid
flowchart TB
  Home["Home — atmosphere + spatial index"]

  About["About — CV of record"]
  Projects["Projects — stills of record"]
  Lab["Lab — experiments"]
  Gallery["Gallery — photographs"]

  Home --> About
  Home --> Projects
  Home --> Lab
  Home --> Gallery

  About -->|"shared slug"| Case["Case study /projects/:slug"]
  Projects -->|"shared slug"| Case
  Case -->|"Back"| Projects
  Lab -->|"Back"| Experiment["/lab/:experiment"]
```

Rule of thumb: **About narrates, Projects shows, Lab plays, Gallery is extra.** Anything with a case study slug belongs in both About and Projects. Anything CV-only (employment, education, skills, awards without stills) stays on About. Experiments never appear in Projects unless they graduate.

---

## 9. Source map

| Behaviour | Where |
| --- | --- |
| Routes | `app/**/page.tsx` |
| Header / mobile menu | `components/header.tsx` |
| Home figure hotspots | `app/home/main.tsx` |
| About CV | `app/about/page.tsx` |
| Projects index | `app/projects/page.tsx` |
| Lab index | `lib/lab/labs.ts`, `app/lab/page.tsx` |
| Lab chrome | `app/lab/lab-page-layout.tsx` |
| Intro | `components/loader.tsx`, `stores/intro.ts` |
| Scroll | `components/smooth-scroll.tsx` |
| Pointer | `components/pointer.tsx` |
| Design intent | `DESIGN.md` |
