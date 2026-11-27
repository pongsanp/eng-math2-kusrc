---
name: eng-math2-slides-builder
description: >-
  Project-specific guide for developing Chapter 2 and Chapter 3 interactive
  lecture slides, bilingual content, 3D embeds, and synced notebooks in
  eng-math-2-dashboard (01417168 Engineering Mathematics II). Use when adding
  Ch. 2/3 slides, extending MiniScene3D, updating changelog/versioning, or
  deploying to pongsanp/eng-math2-kusrc and Firebase project eng-math2-kusrc.
---

# Eng Math II (`01417168`) Slides & Project Workflow

Project-specific skill for extending `eng-math-2-dashboard` (especially adding
Chapter 2 & Chapter 3 interactive lecture slides). For general stylus canvas and
Firebase sync architecture patterns, also load the global
`interactive-teaching-webapp` skill.

## Repository & Live Targets

- **Workspace Root:** `C:\Users\pongs\.gemini\antigravity\scratch\eng-math-2-dashboard`
- **GitHub Pages Repo:** `pongsanp/eng-math2-kusrc` (`branch: main`, workflow
  `.github/workflows/deploy.yml`, URL `https://pongsanp.github.io/eng-math2-kusrc/`)
- **Firebase Project:** `eng-math2-kusrc` (Standard `(default)` Firestore in
  `asia-southeast1`, Google Sign-In enabled, authorized domains include
  `localhost` and `pongsanp.github.io`).

## How to Add Chapter 2 & Chapter 3 Lecture Slides

1. **Follow the Existing Bilingual Slide Schema (`src/slides/ch1SlidesData.ts`):**
   - Each deck exports typed `SlideDef[]` entries:
     - `id` (positive integer), `lecture: 1 | 2` (or extend lecture tabs if >2 lectures), `kind: 'cover' | 'concept' | 'example' | 'summary'`
     - Bilingual headings/cards: `tagTh`, `tagEn`, `titleTh`, `titleEn`, `cards`, `cardsEn` (`SlideSectionCard[]` with `heading`, `bullets`, `formulas`, `note`)
     - Bilingual examples: `examples` (`SlideExampleItem[]` with `promptTh`, `promptEn`, `promptLatex`, optional `scene3D: SlideExampleScene3D`)
     - Deep link target back to the 3D Explorer (`Ch1DashboardTarget` -> extend/union with `Ch2DashboardTarget` / `Ch3DashboardTarget`).
2. **Parameterize `SlidesDeck.tsx` & `notebookStorage.ts` by Chapter (`'ch1' | 'ch2' | 'ch3'`):**
   - **CRITICAL BACKWARD COMPATIBILITY RULE:** Chapter 1 deck IDs MUST stay
     exactly `'ch1'` / `'ch1_en'` (default notebook) and `'nb_<id>__ch1'` /
     `'nb_<id>__ch1_en'` (custom notebooks) so zero existing `IndexedDB` or
     Firestore handwriting is orphaned!
   - For Chapters 2 & 3, map cleanly to `'ch2'`, `'ch2_en'`, `'ch3'`, `'ch3_en'`
     and `'nb_<id>__ch2'` etc. Verify composite IDs stay `<= 64` chars matching
     `^[a-zA-Z0-9_-]{1,64}$` in `firestore.rules`.
   - Pass `chapter` into `SlidesDeck` from `src/App.tsx` (allowing students/teachers
     to open Ch. 1, Ch. 2, or Ch. 3 slides cleanly from the top navbar!).
3. **Extend `src/components/slides/MiniScene3D.tsx`:**
   - Reuse existing `src/math/presets.ts`, `src/math/latex.ts`, `src/math/traces.ts`,
     and `src/math/multivar.ts` helpers when adding Ch. 2 (planes, cylinders,
     quadrics, traces) and Ch. 3 (limits, partials, level curves, gradient,
     extrema) embedded 3D previews.
4. **Preserve Writing & Export Ergonomics:**
   - Keep `AnnotationCanvas` prop contract untouched (`strokes`, `eraserMode`,
     `snapShapeMode`, `pencilOnly`, `headerHeight`, etc.).
   - Keep `SlidePrintView` wired to the active chapter's `SlideDef[]` +
     `customPages` + `inkImagesBySlide`.

## Versioning, Quality Gates & Deployment

- **Release Bump:** Update `"version"` in `package.json` AND prepend a
  bilingual entry in `src/data/changelog.ts` (`CHANGELOG_ENTRIES`). Vite
  automatically emits `dist/version.json` and updates `__APP_VERSION__` (so
  iPad Home Screen apps detect the update via `VersionBadge`).
- **Pre-Push Verification (PowerShell 5.1 syntax):**
  ```powershell
  npm run lint; if ($LASTEXITCODE -eq 0) { npm run build }
  ```
  - Must pass `oxlint` with **0 warnings and 0 errors** (`react(refs)`,
    `react(set-state-in-effect)`, `react(only-export-components)`) and `tsc -b && vite build`.
  - Verify visually in headless browser via `npx vite preview --port 4173 --strictPort`.
- **If Touching `firestore.rules`:** Delegate rules editing to the
  `firestore-rules-author` subagent, then deploy with:
  ```powershell
  npx -y firebase-tools@latest deploy --only firestore:rules --project eng-math2-kusrc
  ```
