# Open Design — Best-Practice Research (Primary Sources)

> **Purpose.** Findings to inform a best-practices guide for generating a high-quality, implementation-ready mobile-app design for **Spen** (React Native / Expo budget planner, Bahasa Indonesia UI) with Open Design (nexu-io/open-design).
> **Scope.** Primary sources only: the official GitHub repo (`github.com/nexu-io/open-design`, `main` branch) and first-party docs on `open-design.ai`. Every claim below is cited to a GitHub raw-file URL, a repo path, or a first-party docs URL. No secondary blog posts were used.
> **Source convention.** All raw URLs are of the form `https://raw.githubusercontent.com/nexu-io/open-design/main/<path>` unless noted. When a claim quotes a file, the quote is verbatim.
> **Audience setup being researched for:** the user runs Open Design as a **desktop app** on Windows with **OpenAI Codex** as the local coding-agent design engine, working inside `C:\Users\Engineer\Documents\projects\spen`.

---

## 1. ARCHITECTURE — how Open Design works

### 1.1 Desktop app + local coding agent as the design engine

OpenDesign is a **local-first native desktop app** (macOS Apple Silicon + Intel, Windows x64) that does **not** ship its own agent. The design engine is whichever coding-agent CLI is already installed on the user's machine — Codex, Claude Code, Cursor, Copilot, etc.

- *"🖥️ **Local-first native desktop app for macOS and Windows.**"* — README.md, "What is OpenDesign".
- *"🤖 **Agent-native, model-agnostic.** We don't ship an agent. The `claude` / `codex` / `cursor-agent` / `copilot` / `hermes` / `kimi` already on your `PATH` are the design engine. Swap with one click."* — README.md, "Why OpenDesign".
- Codex is a first-class supported agent: `od mcp install codex` installs the integration; the table lists **Codex CLI — ✅ Supported** — README.md, "Platform Compatibility".
- *"Your CLI becomes the design engine, your laptop becomes the studio, and your team's `DESIGN.md` becomes the brand contract."* — README.md, "What is OpenDesign".

**Topology** (README.md, "Architecture"): browser/Electron shell → local daemon (Express + SQLite) → `spawn(cli, [...], { cwd: managed project cwd })` → the coding agent. *"Local runtime definitions come from `runtimes/registry.ts`; the base registry has 27 definitions (including `byok-opencode`), backed by 26 distinct local CLI executables."*

The daemon delegates the **entire agent loop** — model calls, tool use, context management, permission handling, resume, cancel — to the user's CLI. From `docs/agent-adapters.md` (opening): *"We delegate the **entire agent loop** — model calls, tool use, context management, permission handling, resume, cancel — to the user's existing code agent CLI. OD's job is to detect it, feed it a skill + prompt + working directory, and stream its output back to the web UI."*

### 1.2 How the agent is invoked (Codex specifics)

- *"A new session runs `codex exec --json --skip-git-repo-check` with the effective sandbox configuration, create-only `-C`/`--add-dir` arguments, and optional model/reasoning overrides. The composed prompt is written to stdin."* — `docs/agent-adapters.md` §5.3 (Codex).
- Follow-up turns: *"Follow-up turns use `codex exec resume --json ... <thread-id>`."* — same section.
- **Windows permission posture (relevant for this project):** *"Codex defaults to `workspace-write` with network access on supported macOS and Linux hosts. Windows, WSL, or an explicit `OD_CODEX_SANDBOX=danger-full-access` operator override uses `danger-full-access` because the workspace-write path cannot support the required shell execution there."* — `docs/agent-adapters.md` §10 (Authorization boundaries).

### 1.3 Working-directory requirements for local agents

The project workspace **is** the agent's working directory. There is no separate artifact directory passed to the CLI:

- *"The daemon spawns the runtime with the project workspace as its working directory and streams normalized events over SSE."* — `docs/architecture.md` §4 (Generation data flow, filesystem profile).
- Claude (reference adapter): *"The process itself is spawned in the effective project cwd; there is no `--cwd <artifact-dir>` prompt invocation."* — `docs/agent-adapters.md` §5.1.
- Cursor: *"`--workspace <project-cwd>`"* — §5.5. Codex: *"create-only `-C`/`--add-dir` arguments"* widen the sandbox to extra roots — §5.3.
- For a **folder-imported project**, the daemon uses the user-selected external `metadata.baseDir` as the workspace instead of copying it into managed storage: *"an imported project uses the user-selected external `metadata.baseDir`"* — `docs/architecture.md` §3.5. (Relevant if you point Open Design at the `spen` repo itself rather than a managed project folder.)

**Skill staging** — skills are copied, not symlinked, into the run workspace: *"Attempts to copy each selected skill directory into `<project-cwd>/.od-skills/<basename>-<source-path-hash>/`. These are real, dereferenced project-private copies—not symlinks or junctions"*; the prompt advertises *"both the cwd-relative staged path and the absolute source fallback"* — `docs/agent-adapters.md` §4; also `docs/skills-protocol.md` §3 (Runtime resource staging).

### 1.4 How prototypes are generated — the two execution profiles

There are exactly two handoff profiles (`docs/architecture.md` §4):

1. **Filesystem execution profile** (structured/tool-capable CLIs like Codex): *"Structured/tool-capable runtimes write canonical project files. File events update the file workspace, and a previewable file becomes the rendered deliverable. The assistant ends with an ordinary summary of the files it wrote; it does **not** duplicate source in a code `<artifact>` block."*
2. **Text-artifact execution profile** (plain-stream/BYOK): *"Their canonical deliverable is one complete source-code `<artifact>` block. The host parses and materializes that output so it reaches the same file workspace and preview surfaces."*

For plain-stream runs, the daemon scans stdout for `<artifact>` blocks and materializes them as project files (`docs/agent-adapters.md` §5.13): `text/html` → `<identifier>.html`, `text/css` → `<identifier>.css`, `image/svg+xml` → `<identifier>.svg`, `text/markdown` → `<identifier>.md`; identifiers are slugged and collisions get `-2`, `-3`, etc.

### 1.5 What "mode: prototype" means

From `docs/skills-protocol.md` §4.1:

- **Purpose:** "single-screen interactive prototype."
- **Preview:** `html` or `jsx`.
- **Primary output:** `index.html` or `Prototype.jsx`.
- **Typical workflow:** "clarify brief → resolve design tokens → write component tree → write file."
- **Example templates:** interface and responsive-flow bundles under `design-templates/`.

The `mobile-app` template declares `od.mode: prototype`, `od.platform: mobile`, `preview: { type: html, entry: index.html }` — `design-templates/mobile-app/SKILL.md` frontmatter. In the New Project UI, Prototype is one of six creation tabs and *"records `kind: prototype`"*; a selected Start-from-template replaces the tab's default skill as the project's primary `skillId` — `docs/modes.md` (Prototype row).

### 1.6 Outputs, export, artifact format

- **Where outputs are written:** into the project workspace as canonical project files; preview follows the files (`docs/architecture.md` §4). The mobile-app workflow writes the render to the project root as **`index.html`** ("Copy `assets/template.html` to the project root as `index.html`" — mobile-app `SKILL.md` Step 1). One project = one screen's render; multiple screens = multiple projects/folders (see §6.3).
- **Export formats:** *"HTML (inlined) · PDF (browser print) · PPTX (agent-driven) · ZIP · Markdown · MP4 (HyperFrames)"* — README.md, "Architecture" table; also "Every deck exports to HTML (single file, inlined assets), PDF (browser print, deck-aware), PPTX (agent-driven skill), ZIP (archive), or Markdown."
- **Artifact XML format** (emitted when the run returns an artifact block instead of files): the daemon accepts Anthropic-style source blocks such as
  ```html
  <artifact identifier="landing-page" type="text/html" title="Landing page">
  <!doctype html>
  <html>...</html>
  </artifact>
  ```
  — `docs/agent-adapters.md` §5.13. The mobile-app skill's own emit format is quoted in §2.6.
- **MCP for live files:** *"OpenDesign ships a stdio MCP server and per-agent install scripts. Any MCP-compatible agent in another repo can read files from your local OpenDesign projects directly — tokens CSS, JSX components, entry HTML — as a structured API queryable by name. The agent always sees the live file, not a stale export."* — README.md, "Use OpenDesign from your coding agent" (`od project list --json`, `od files read <project-id> <relative-path>`, etc.).

---

## 2. THE `mobile-app` TEMPLATE SKILL (full extraction)

Repo path: `design-templates/mobile-app/` — `SKILL.md`, `assets/template.html`, `references/layouts.md`, `references/checklist.md`, plus `example.html`.

### 2.1 `od:` frontmatter requirements

```yaml
od:
  mode: prototype
  platform: mobile
  scenario: design
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  craft:
    requires: [state-coverage, animation-discipline]
```
— `design-templates/mobile-app/SKILL.md` (verbatim).

Notes on what these fields do (`docs/skills-protocol.md` §2.1):
- `od.design_system.requires: true` means *"compose the complete active design-system context"* into the prompt.
- `od.craft.requires` injects the named brand-agnostic craft rulebooks **between** the design-system context and the skill body: *"the daemon injects the concatenated craft body **between** the active DESIGN.md and the skill body. Brand tokens in DESIGN.md win on conflict; craft rules cover everything DESIGN.md does not override."* — `docs/skills-protocol.md` §5.5.
- The declared `sections: [color, typography, layout, components]` is the template's *intent* declaration; the current protocol states design systems are **not** section-pruned at compose time: *"Design systems are not copied into the run CWD, section-pruned through `od.design_system.sections`, or substituted through a `{{ design_system }}` variable."* — `docs/skills-protocol.md` §5. So the Spen `DESIGN.md` should still cover those four areas substantively, but the daemon composes the whole document.

### 2.2 The 5-step workflow

From `design-templates/mobile-app/SKILL.md` (headings verbatim; content condensed with exact quotes):

- **Step 0 — Pre-flight:** (1) *"Read `assets/template.html` end-to-end through the `<style>` block. The Dynamic Island, status bar SVG icons, home indicator, side rails, and tab bar are all already drawn in HTML/SVG — do not re-implement them inline on each screen."* (2) Read `references/layouts.md` so you know the 6 archetypes. (3) *"Read the active DESIGN.md — map its tokens to the six `:root` variables in the seed."*
- **Step 1 — Copy the seed:** *"Copy `assets/template.html` to the project root as `index.html`. Replace the six `:root` variables with the active design system's tokens. Replace the page `<title>` and the caption above the device."*
- **Step 2 — Pick exactly one archetype:** table mapping brief language → archetype A–F (see §2.3). *"A mobile screen does **one job**. If the brief seems to combine two, ship one screen and offer the other as a follow-up."*
- **Step 3 — Paste and fill:** *"Copy the archetype block from `layouts.md` into `<main class="content">`, replacing the placeholder card. Fill bracketed text with real, specific copy from the brief. **Drop the `<nav class="tabbar">` block entirely** for archetypes that don't show one (B, C, E)."*
- **Step 4 — Self-check:** *"Run through `references/checklist.md`."* Extra attention: frame intact (Dynamic Island, status bar SVGs, home indicator); tap targets ≥ 44px; one accent ≤ 2×; display headings still `var(--font-display)`.
- **Step 5 — Emit the artifact:** format below, *"One sentence before describing what's there. Stop after `</artifact>`."*

### 2.3 The 6 archetypes A–F and their trigger language

From `references/layouts.md` ("Choosing an archetype from a brief" table):

| If the brief mentions… | Use |
|---|---|
| feed, inbox, timeline, list, messages | A — Feed |
| article, post, item, recipe, song, product | B — Detail |
| sign-up, welcome, intro, walkthrough | C — Onboarding |
| profile, account, user page, bio | D — Profile |
| checkout, payment, order, form, settings step | E — Checkout |
| timer, map, dashboard widget, single big number | F — Focus |

And the SKILL.md table adds: A — "feed, inbox, timeline, list, messages, notifications"; B — "article, post, item, recipe, song, product, song detail"; C — "sign-up, welcome, intro, walkthrough, tour"; D — "profile, account, user page, someone's bio"; E — "checkout, payment, order, form, settings step"; F — "timer, map, dashboard widget, single big number".

*"If two fit, pick the one that better matches the *primary* action the user takes on this screen."* — `references/layouts.md`.

Tab-bar rule per archetype: *"If the archetype implies a tab bar, keep it; otherwise delete the entire `<nav class="tabbar">` block. Onboarding, detail, and checkout screens generally don't show one."* — `references/layouts.md` (Pre-flight).

**Class inventory** (only these classes exist in the seed; extend via the seed's `<style>`): `pad` `stack` `row` `row-between` `grid-2` `grid-3` `header` `greeting` `h2` `h3` `meta` `num` `card` `card.accent` `card.flat` `list-row` `avatar` `tag` `pill` `tabbar` `tab` `tab.active` `btn-primary` `btn-secondary` `ph-img` `progress` — *"If you reach for a class not on this list, define it in the seed's `<style>` first."* — `references/layouts.md`.

### 2.4 The HARD RULES

From `design-templates/mobile-app/SKILL.md` ("Hard rules", verbatim):

- **The phone is real.** Dynamic Island gap, SVG status icons, home indicator. The seed protects all three — don't rewrite the frame.
- **Single screen, single job.** No multi-tab tours, no spliced flows.
- **Accent budget = 2.** One active tab + one primary action is the default.
- **Numerics in mono** via `.num` class.
- **Display in serif** via `var(--font-display)`.
- **No external images** — use `.ph-img` placeholders.

### 2.5 P0/P1/P2 checklist essentials + anti-fake-device rules

From `references/checklist.md` (verbatim items, abridged for the P0 list):

**P0 — must pass**
- Frame looks like a phone, not a generic card (Dynamic Island, status bar SVG signal/wifi/battery, home indicator; don't delete island/rails/indicator markup).
- *"Status bar shows real glyphs, not text like `· · · 5G · 100%`. Use the SVG icons from the seed."*
- Home indicator is the last visible thing.
- *"Content scrolls, frame doesn't."* `<main class="content">` has `overflow-y: auto`; the `.device` does not.
- *"Tap targets ≥ 44px tall."* (seed: `.btn-primary` 48px, `.tab` ~50px, `.icon-btn` 36px ≥ touch with padding, `.list-row` ≥48px).
- *"Body text ≥ 14px."* (`--fs-body: 15px`; list-row sub text 13px max is the floor).
- *"One accent, used at most twice on the screen."* Never three.
- *"No external image URLs. Use the `.ph-img` placeholder class. External CDN images break the OD preview iframe and look fake when they 404."*
- Tab bar matches the screen kind (drop `<nav class="tabbar">` for Onboarding/detail/checkout; keep for feed/focus/profile).
- *"Display headlines use `var(--font-display)` (serif). … Don't override headings to system-sans — it instantly looks like a stock template."*
- *"No emoji icons in the UI. SVG monoline only. Emoji in copy is fine ('9:41 ☀️ Tuesday' is not, but 'Sunny day in Berlin' is)."*
- *"`data-od-id` on the device, content, header, and any major sections."*

**P1 — should pass**
- One screen, one job.
- Caption above the device names the screen (e.g. "FILEBASE · INBOX").
- Status bar time is `9:41` (Apple convention) unless the brief asks otherwise.
- Mono font for numerics — counts, prices, durations, dates (`.num` class).
- *"Real, specific copy. 'Mira Hassan · CTO' beats 'User Name'. '$1,920' beats '$X,XXX'."*
- *"First-screen content fits inside the 844px frame without requiring scroll for the primary action. If the CTA is below the fold, it's the wrong layout."*

**P2 — nice to have**
- Subtle accent radial gradient on page background (in seed).
- Backdrop-blurred tab bar (in seed via `backdrop-filter`).
- At most one image placeholder per screen.
- Subtle metallic side rails on the bezel (in seed via `::before`/`::after`).

**Anti-fake-device checklist** (if any of these are true, the screen looks like *"a card pretending to be a phone"*): outer corners not visibly more rounded (~56px) than inner screen (~44px); no Dynamic Island gap; status bar text grey/low-opacity (should be `var(--fg)` full strength); home indicator missing; tab bar with no top border or no backdrop blur. *"The seed prevents all of these — the most common regression is the agent rewriting the frame with `border-radius: 24px` and losing the depth."*

### 2.6 Exact artifact XML format

```
<artifact identifier="mobile-slug" type="text/html" title="Mobile — Screen Name">
<!doctype html>
<html>...</html>
</artifact>
```
— `design-templates/mobile-app/SKILL.md` Step 5. The identifier is a slug (e.g. `mobile-slug`), the type is `text/html`, and the title names the screen ("Mobile — Screen Name"). *"One sentence before describing what's there. Stop after `</artifact>`."*

### 2.7 Seed anatomy (`assets/template.html`) — the numbers implementation must match

- Frame: *"A pixel-accurate iPhone 15 Pro frame (390 × 844)"*; `.device` is 390×844 with `border-radius: 56px`, `padding: 12px`; `.screen` has `border-radius: 44px`; Dynamic Island `.island` is 124×36 at `top: 22px`; status bar is `flex: 0 0 47px`; home indicator block is 28px (`width: 134px; height: 5px` bar); content region `overflow-y: auto`.
- Status bar shows `9:41` (`.num`) plus SVG signal/wifi/battery glyphs — no text glyphs.
- **Mobile type scale:** `--fs-h1: 26px; --fs-h2: 20px; --fs-h3: 16px; --fs-body: 15px; --fs-meta: 12px;` with the comment *"mobile type — one step down from web-prototype defaults."*
- `--radius-card: 18px; --radius-pill: 999px;`
- **The six `:root` variables** the skill tells the agent to replace: `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent` (plus derived `--accent-soft`, `--fg-soft`, font stacks, type scale, radius). Comment in seed: *"Tokens at the top of `<style>` mirror the web-prototype seed so a single DESIGN.md flows into both."*
- Tab bar: 4 tabs by default (`grid-template-columns: repeat(var(--tabs, 4), 1fr)`), `backdrop-filter: blur(20px)`, active tab uses `--accent`; `.btn-primary` min-height 48px, radius 14px.
- The seed's default tab bar is **Home / Search / Activity / Profile** — the Spen brief specifies a 5-slot bar (`Beranda | Rencana | [+] | Report | Settings`), so the agent must **add the 5th slot and a center "＋"** (a justified extension of the archetype — define it in the seed's `<style>` per the class-inventory rule).

---

## 3. `DESIGN.md` BRAND CONTRACT

### 3.1 What Open Design requires of a DESIGN.md design system

- A design system is a **package**, not a standalone file: `design-systems/<slug>/` with **`manifest.json` + `DESIGN.md` + `tokens.css`** (minimum shape) — `design-systems/README.md` and `docs/design-systems.md` §1.
- *"`manifest.json` owns stable discovery metadata, provenance, and declared package paths. `DESIGN.md` is the canonical design prose for agents. `tokens.css` is the canonical compiled semantic-token stylesheet."* — `design-systems/README.md`.
- **DESIGN.md content requirements:** *"`DESIGN.md` does not use a fixed nine-section template. The package-quality guard requires at least seven substantive H2 headings for migrated packages, without prescribing their names, order, or numbering."* A useful document normally covers: visual theme/atmosphere; color roles and contrast intent; typography families/scale/leading/tracking; spacing/layout/composition; components and interaction states; motion behavior and reduced-motion handling; accessibility expectations; concrete anti-patterns. — `docs/design-systems.md` §3. (The historical 9-section sample still exists as an interop example at `docs/examples/DESIGN.sample.md` — sections: Visual Theme & Atmosphere; Color Palette & Roles; Typography Rules; Component Stylings; Layout Principles; Depth & Elevation; Do's and Don'ts; Responsive Behavior; Agent Prompt Guide.)
- **Prose must match tokens:** *"Keep prose and compiled values synchronized. If `DESIGN.md` names an accent, type scale, spacing rhythm, or motion duration, the corresponding binding in `tokens.css` must express the same decision."* — `docs/design-systems.md` §3.
- **manifest.json (v1):**
  ```json
  {
    "schemaVersion": "od-design-system-project/v1",
    "id": "acme",
    "name": "Acme",
    "category": "Productivity & SaaS",
    "description": "A concise English catalog summary.",
    "source": { "type": "bundled", "origin": "OpenDesign curated bundled fixture" },
    "files": { "design": "DESIGN.md", "tokens": "tokens.css" }
  }
  ```
  — `design-systems/README.md`; *"The folder slug and `manifest.id` must match and use normalized ASCII."* Rich packages add `USAGE.md`, `components.html`, `components.manifest.json`, `design-tokens.json`, `tailwind-v4.css`, `assets/`, `fonts/`, `preview/`, `source/`. Real-world example: `design-systems/linear-app/manifest.json`.

### 3.2 How DESIGN.md is attached/selected per render

- *"Each subfolder is a portable design-system package. Selecting one from the Design System surface or a supported project-creation workflow composes its design context into the agent prompt."* — `design-systems/README.md`.
- *"Switch a system → the next render uses the new tokens."* — README.md, "Design Systems".
- **Composition order** (what the agent sees in its system prompt, `docs/skills-protocol.md` §5): (1) package `USAGE.md` guidance; (2) the **complete `DESIGN.md` body**; (3) import-mode guidance; (4) `tokens.css`; (5) compact component manifest or `components.html`; (6) manifest-derived rich-file index; (7) craft references (`od.craft.requires`); (8) the active skill/template body. *"Brand tokens in DESIGN.md win on conflict; craft rules cover everything DESIGN.md does not override."*
- Every render therefore **re-reads the active DESIGN.md** — improving DESIGN.md between renders improves every subsequent screen automatically (this is the basis of the iteration workflow in §7).
- Design System is a separate product surface (not a New Project tab); Prototype/Deck/Template/Other projects apply a design system; Live Artifact and Media hide the picker — `docs/modes.md`.

### 3.3 How the seed's six `:root` variables map to design-system tokens

The mobile-app seed's six replaceable variables are exactly the six **A1-identity** tokens in the shared schema: `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent` (plus derived `--accent-soft`, `--fg-soft`). From `packages/contracts/src/design-systems/token-schema.ts`:

- `--bg` — "Page background — defines the brand canvas." (A1-identity)
- `--surface` — "Card / lifted container background." (A1-identity)
- `--fg` — "Primary text color." (A1-identity)
- `--muted` — "Subtext / captions." (A1-identity)
- `--border` — "Default border / card edge." (A1-identity)
- `--accent` — "Brand accent. ≤2 visible uses per screen (lint enforced)." (A1-identity)

The schema defines four layers: **A1-identity** (required, the brand), **A1-structure** (required, type scale/layout), **A2** (required with sensible fallback), **B-slot** (optional, aliasable), plus **C-extension** (brand-specific, allowlisted per brand via `BRAND_EXTENSIONS`). A full `tokens.css` must declare every A1 + A2 + B-slot token (see the `default/tokens.css` for the canonical starter file — 60+ tokens across surface, foreground ramp, border, accent states `--accent-on/--accent-hover/--accent-active`, semantic `--success/--warn/--danger`, fonts, type scale, spacing, radius, elevation, focus ring, motion, layout).
- The intended usage contract (verbatim comment in `design-systems/default/tokens.css`): *"Agents are expected to paste the `:root { … }` block verbatim into the first `<style>` of every artifact they generate against this design system, then reference tokens via `var(--name)` from then on."*

### 3.4 Spen alignment

The Spen repo already maintains `docs/design/DESIGN.md` (brand contract) and `docs/design/design-tokens.md` (slot tokens **without values** — values chosen by the design agent at render time and recorded back). This matches the OD package contract: prose (`DESIGN.md`) + token slots + a compiled token stylesheet are the three canonical artifacts; values live in `tokens.css` and must be synchronized with prose (see §5).

---

## 4. PROMPT BEST PRACTICES (officially documented)

### 4.1 Briefs and single-screen-per-render

- The product loop is `brief → plugin → direction → design system → artifact → handoff → memory` (README.md, "A full workflow"). Direction (design system) is locked *before* the first deliverable; artifacts are generated one at a time.
- **One screen per render is a hard rule of the mobile-app template**: *"A mobile screen does **one job**. If the brief seems to combine two, ship one screen and offer the other as a follow-up."* (SKILL.md Step 2). P1 checklist: *"One screen, one job. A profile screen does profile things. Don't graft a checkout form onto a feed."*
- **Route first, clarify only when needed** (od-default scenario): *"Infer the task type from the user's brief and known conversation context. When one route is reasonably clear, bind it and continue directly… Emit the form below only when two or more routes remain materially plausible and choosing the wrong one would change the delivery format."* — `plugins/_official/scenarios/od-default/SKILL.md`. (Don't add discovery question-forms unless genuinely blocking.)

### 4.2 Archetype selection

- Choose the archetype from the trigger tables (§2.3); *"If two fit, pick the one that better matches the *primary* action the user takes on this screen."* — `references/layouts.md`.
- **Do not write screens from scratch:** *"Don't write screens from scratch — pick the closest archetype, paste, swap copy."* — `references/layouts.md`.

### 4.3 Copy specificity

- P1 checklist: *"Real, specific copy. 'Mira Hassan · CTO' beats 'User Name'. '$1,920' beats '$X,XXX'."* — `references/checklist.md`.
- anti-ai-slop cardinal sin #7: *"Filler copy — `lorem ipsum`, `feature one / two / three`, `placeholder text`, `sample content`. An empty section is a design problem to solve with composition, not by inventing words."* — `craft/anti-ai-slop.md`.
- anti-ai-slop cardinal sin #6: *"Invented metrics — '10× faster', '99.9% uptime', '3× more productive'. Either pull from a real source or use a labelled placeholder."*
- For Spen: copy must be Bahasa Indonesia with the domain glossary from `CONTEXT.md` (the mobile-app template's bracketed `[ ... ]` copy slots are filled from the brief — see the Spen guide §4 which is aligned with this).

### 4.4 Light/dark theming — `data-theme` vs two frames

- **The official token mechanism** is a theme selector in `tokens.css`: *"When the system supports a dark variant, override semantic tokens under a theme selector rather than copying unrelated component rules: `[data-theme="dark"] { --bg: #111113; --fg: #fafafa; }`"* — `docs/design-systems.md` §4.
- **Dark-theme value guidance** (`craft/color.md`): avoid pure black/pure white — Background `#0f0f0f` (not `#000`) / `#fafafa` (not `#fff`); Foreground `#f0f0f0` / `#111111`; on dark surfaces prefer semi-transparent white borders (`rgba(255,255,255,0.08)`).
- **The mobile-app seed ships ONE theme** (no `[data-theme]` block in `assets/template.html`; `example.html` is light-only). So for mobile-app renders, light+dark = **two separate frames/renders** (or add a `[data-theme="dark"]` override in the pasted `:root` — but the seed's CSS is written against the light tokens, so the supported path is two frames). The Spen guide already encodes this: *"Light + dark: template `mobile-app` default-nya satu tema. Untuk light+dark, render dua frame (satu light, satu dark) atau pakai `[data-theme="dark"]` bila seed mendukung"* — `docs/design/open-design-guide.md` §1.

### 4.5 Token mapping, `.num`, `data-od-id`

- **Token mapping:** Step 0.3 — *"Read the active DESIGN.md — map its tokens to the six `:root` variables in the seed."*; Step 1 — *"Replace the six `:root` variables with the active design system's tokens."* (SKILL.md). The `default/tokens.css` contract: paste the `:root` block verbatim, then reference via `var(--name)`.
- **`.num` (mono numerics):** *"Mono font for numerics — counts, prices, durations, dates. The seed's `.num` class binds this."* (P1); `.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }` (template.html).
- **`data-od-id`:** P0 requires it *"on the device, content, header, and any major sections"*; P2: *"Sections without `data-od-id` — comment mode can't target them."* (checklist.md). In `references/layouts.md` every archetype section carries `data-od-id` (`header`, `filters`, `feed`, `hero`, `meta`, `body`, `cta`, `onboarding`, `head`, `stats`, `tabs`, `post-list`, `title`, `item`, `details`, `totals`, `hero-card`, `stats-row`, `up-next`).

### 4.6 No external images — `.ph-img` placeholders

- P0: *"No external image URLs. Use the `.ph-img` placeholder class. External CDN images break the OD preview iframe and look fake when they 404."* — `references/checklist.md`.
- anti-ai-slop (P1): *"External placeholder image CDNs (`unsplash.com`, `placehold.co`, `placekitten.com`, `picsum.photos`). Fragile and obvious. Use the shipped `.ph-img` placeholder class."* — `craft/anti-ai-slop.md`.

### 4.7 Anti-emoji-for-icons — SVG monoline

- P0: *"No emoji icons in the UI. SVG monoline only."* — `references/checklist.md`.
- anti-ai-slop cardinal sin #3: *"Emoji as feature icons — `✨`, `🚀`, `🎯`, `⚡`, `🔥`, `💡` inside `<h*>`, `<button>`, `<li>`, or `class*="icon"`. Use 1.6–1.8px-stroke monoline SVG with `currentColor`."* — `craft/anti-ai-slop.md`. The seed's own icons: `.header .icon-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.7; }` and `.tab svg { stroke-width: 1.7; }`, active tab `stroke-width: 2` (template.html).

### 4.8 Other anti-AI-slop P0/P1 rules that apply to every render

From `craft/anti-ai-slop.md` — *"failing an enforced rule is not a style preference, it is a regression"*:
- **Default Tailwind indigo as accent** (`#6366f1`, `#4f46e5`, `#4338ca`, `#3730a3`, `#8b5cf6`, `#7c3aed`, `#a855f7`) — use the active `DESIGN.md`'s `--accent`. (Linter auto-checks: `AI_DEFAULT_INDIGO` in `apps/daemon/src/lint-artifact.ts`.)
- **Two-stop "trust" gradient** on the hero (purple→blue, blue→cyan, indigo→pink).
- **Sans-serif on display text when the seed binds a serif** — h1/h2 must use `var(--font-display)`.
- **Rounded card with a colored left-border accent** — the "AI dashboard tile" shape.
- **More than ~12 raw hex values outside `:root`** (P1) — tokens were not honoured.
- **`var(--accent)` used 6+ times in the rendered body** (P1) — cap is 2 visible uses per screen.
- Lint enforcement loop: *"The daemon's `lint-artifact` linter… reports these as findings back to the UI (for P0/P1 badges) and to the agent (as a system reminder for self-correction)."* — `craft/README.md` (Enforcement levels).
- Typography craft (`craft/typography.md`) — ALL CAPS needs `0.06em–0.1em` tracking; small text 11–13px gets `0.01–0.02em`; UI labels/buttons `0.02em`; headings ≥32px `-0.01em` to `-0.02em`; max 2 typefaces; 3-weight system (400/510–550/590–600); body line length 50–75 chars (`max-width: 65ch`).
- Color craft (`craft/color.md`) — neutrals 70–90% of pixels, accent 5–10% (one accent, never a second), semantic 0–5%; contrast gates: body ≤16px on bg **4.5:1**, large text **3:1**, UI components vs adjacent surfaces **3:1**; name tokens by purpose never by hue (`--success` not `--green-500`).

---

## 5. RECORDING CONCRETE VALUES BACK (persisting chosen tokens)

Official mechanisms for making the design agent's concrete choices reproducible:

1. **`tokens.css` is the canonical compiled token stylesheet** — the single machine-readable source of truth for concrete values. *"`tokens.css` is the canonical compiled semantic-token stylesheet."* — `design-systems/README.md`. Agents are expected to *"paste the `:root { … }` block verbatim into the first `<style>` of every artifact"* and reference via `var(--name)` (comment in `design-systems/default/tokens.css`).
2. **`DESIGN.md` prose + `tokens.css` must be kept synchronized** — *"Keep prose and compiled values synchronized. If `DESIGN.md` names an accent, type scale, spacing rhythm, or motion duration, the corresponding binding in `tokens.css` must express the same decision."* — `docs/design-systems.md` §3. Updating DESIGN.md after a render is therefore the *documented* way to lock in the values the agent picked.
3. **`manifest.json` declares the package files** (`files.design`, `files.tokens`, plus rich files) so the picker/daemon finds and composes them — `design-systems/README.md`.
4. **Derived artifacts are generated, not hand-edited:** `components.manifest.json` is regenerated from `components.html` + `tokens.css`; `design-tokens.json` (a Design Tokens JSON usable by developers) *"is derived from the token-contract report and must agree with `tokens.css`"*; `tailwind-v4.css` is derived from `tokens.css` — `design-systems/README.md` and `docs/design-systems.md` §1.
5. **`USAGE.md` is the agent-facing router** with required H2 sections `Read Order`, `Design Highlights`, `Do`, `Avoid` — *"direct the agent to the relevant package files and call out decisions that would otherwise be easy to miss"* — `docs/design-systems.md` §5.
6. **The Design System product surface is where refinement happens** — extract/refine a brand's visual language, preview, then create with it (README product tour, "Design System"); AI-enriched systems are marked `enrichmentStatus: programmatic | ai_refined` (docs/design-system-tracking-spec.md — archived implementation plan, but the status field and edit surfaces are implemented).
7. **The dark-mode contract lives in the same file:** override semantic tokens under `[data-theme="dark"]` in `tokens.css` rather than duplicating component rules — `docs/design-systems.md` §4.

**Spen practice (aligned with the above):** `docs/design/design-tokens.md` deliberately defines slots *without values*; the design agent picks values at render and records them back after approval — *"Nilai konkret (warna, font, ukuran) TIDAK diisi di sini — itu keputusan visual design agent saat rendering, dan hasilnya direkam balik (misal sebagai token CSS di DESIGN.md atau file terpisah) setelah disetujui."* For implementation fidelity, the recorded values should land in a compiled `tokens.css`-style file (or the OD package `design-systems/spen/` with `manifest.json` + `DESIGN.md` + `tokens.css`) so React Native tokens can be generated 1:1 from it (see §6).

---

## 6. HANDOFF TO IMPLEMENTATION

### 6.1 Official guidance on translating HTML prototypes to code

- *"**Hand off to engineering.** The artifact is real HTML/CSS — drop it into Cursor, Codex, or Claude Code to keep building as code."* — README.md, "A full workflow" step 4. Mobile-app demo caption: *"Hand off straight to Cursor / Codex / Claude Code to turn into React/Next/Vue."* — README.md, "Demo".
- The artifact is *"single-page artifacts in real CSS, real fonts, real components, exported straight to HTML / PDF / PPTX / MP4 — already shaped by your design system, already runnable inside the agent you use every day"* — README.md, "What is OpenDesign". Fidelity is inherent: the prototype **is** the design system rendered (same CSS custom properties, same fonts, same components), so a React Native implementation can map tokens 1:1.
- **Export-to-React scenario plugin** — `plugins/_official/scenarios/od-react-export/SKILL.md` (verbatim workflow):
  1. *"Inspect the current artifact and identify the smallest React component boundary that preserves the design."*
  2. *"Produce React 18 + TypeScript code with clear props only for content or state that is likely to vary."*
  3. *"Prefer Tailwind CSS when the target project already supports it; otherwise keep styling local and easy to move."*
  4. *"Preserve accessibility semantics from the artifact, including headings, buttons, links, labels, focus states, and alt text."*
  5. *"Finish with file placement notes, required assets, and any assumptions about routing or data."*
  Quality bar: *"Do not flatten the artifact into generic divs."* · *"Do not introduce a component library unless the target project already uses it."* · *"Keep generated props and variants minimal."*
- Other handoff scenarios in the official catalog: `od-code-migration` (refresh an existing codebase to a brand spec via git repo + DESIGN.md), `od-figma-migration`, `od-nextjs-export`, `od-vue-export` — README.md, "Plugins" and "Why OpenDesign" ("Refresh an existing codebase… Hand a `git` repo + `DESIGN.md` to the agent and it refactors your real components to the brand spec.").
- **MCP keeps implementation and design in sync:** the coding agent in the spen repo can read the live Open Design files — *"the agent always sees the live file, not a stale export"* (`od project list --json`, `od files read <project-id> <relative-path>`) — README.md.

### 6.2 Fidelity between prototype and final app

- Prototypes use the exact tokens, fonts, and component styles of the active design system (README "Figma alternative" framing; `tokens.css` paste-verbatim contract). Fidelity is preserved as long as implementation consumes the same token values and component proportions.
- **Craft guidance for cross-platform motion parity** (`craft/animation-discipline.md`, "Cross-platform handoff"): *"iOS uses spring physics with perceptual `(response, dampingFraction)` parameters"* (Apple SwiftUI default spring: `(response: 0.5, dampingFraction: 0.825, blendDuration: 0)`); Android uses cubic-bezier through M3 motion tokens; web has View Transitions. *"If the brief specifies platform fidelity, follow the platform; if it specifies brand consistency, pick one motion vocabulary and apply it everywhere."* For a React Native/Expo app this means mapping durations/easings from the design tokens (`--motion-fast: 150ms`, `--motion-base: 200ms`, `--ease-standard: cubic-bezier(0.2, 0, 0, 1)` per `docs/design-systems.md` §7) to RN `Animated`/Reanimated equivalents.
- **State coverage carries into implementation:** the five required states (loading / empty / error / populated / edge) with concrete composition rules (see §7.4) — these are exactly the states a React Native implementation must render, and the mock renders should demonstrate them (Spen brief already lists required states: empty, loading AI, over-budget, defisit, goal tercapai, error).

### 6.3 Organizing outputs per screen for a later agentic ticket workflow

- Prototype mode's primary output is **one `index.html` per project** ("Copy `assets/template.html` to the project root as `index.html`" — SKILL.md Step 1; "Primary output: `index.html`" — `docs/skills-protocol.md` §4.1).
- Consequence: **one screen per project/folder**, each containing `index.html` (plus the staged `.od-skills/` copy under the project cwd — `docs/agent-adapters.md` §4). A render that also emits an `<artifact>` block gets materialized to `<identifier>.html` — `docs/agent-adapters.md` §5.13.
- Spen's existing guide already encodes the folder convention: *"Output per layar: satu `index.html` per layar. Kalau render banyak layar, simpan di folder terpisah (misal `design/renders/beranda/`, `design/renders/rencana/`)."* — `docs/design/open-design-guide.md` §7. This gives the later agentic ticket workflow a stable file reference per screen (e.g. `docs/design/renders/beranda/index.html`).
- **Machine-readable anchors for tickets:** `data-od-id` on device/content/header/major sections (P0) and `data-od-id`-tagged archetype sections are the stable element identifiers an implementation/ticket workflow can reference; the caption above the device names the screen (P1: e.g. "SPEN · BERANDA").

---

## 7. ITERATION WORKFLOW

### 7.1 The officially suggested loop: lock direction → first artifact → review → refine

The product loop is `brief → plugin → direction → design system → artifact → handoff → memory` (README.md, "A full workflow"): (1) PM submits a brief; (2) *"A designer (or the agent) locks the direction… No brand? Pick from 5 curated directions. Have a brand? Drop a screenshot / URL → the agent … codifies a reusable `DESIGN.md`."* (3) first deliverable; (4) hand off; (5) *"OpenDesign gets smarter as you use it. Your screenshots, fonts, palettes, and confirmed artifacts accumulate as defaults for the next session. Less rework, less drift."*

Because **every render composes the active DESIGN.md** (`docs/skills-protocol.md` §5), refining DESIGN.md between renders is the officially supported way to propagate a correction to all future screens ("Switch a system → the next render uses the new tokens" — README). The "render one screen → review → refine DESIGN.md → render the rest" sequencing is the Spen guide's application of this (open-design-guide.md §6: *"Render layar inti dulu… Review 1 layar, refine design system (DESIGN.md) kalau perlu — sebelum render sisanya"*).

### 7.2 Refine per-screen rather than regenerate — the official refine plugin

`plugins/_official/scenarios/od-design-refine/SKILL.md` (verbatim):
- *"Use this plugin when the user wants to improve an existing OpenDesign artifact rather than create a new one."*
- Workflow: (1) *"Inspect the current artifact and identify the highest-leverage refinement target."* (2) *"Pick one direction before editing: clarity, hierarchy, polish, accessibility, responsiveness, or fidelity."* (3) *"Make the smallest useful patch that advances that direction."* (4) *"Critique the result against the active design system and the user's stated goal."* (5) *"Stop when the patch is coherent, then summarize what changed and what should be checked next."*
- Quality bar: *"Preserve the existing product intent."* · *"Prefer small reviewable patches over broad redesigns."* · *"Keep accessibility and responsive behavior intact."* · *"Do not introduce a new design language unless the user explicitly asks for one."*

The desktop app's editing tools (Draw / Edit / Comment / Mark) all funnel intent to the agent as a run (`edit_surface: chat|edit|draw|comment|mark|direct_module` — `docs/design-system-tracking-spec.md` §3.4), i.e. in-app iteration is per-element/per-direction surgical edits backed by an agent run.

### 7.3 Critique gate before emit

- *"Artifact lint API + 5-dim self-critique pre-emit gate"* — README.md, "Roadmap". The `critique` design template is a *"Five-dimensional self-critique scoresheet"* (README, design-template table) and skills may set `od.critique.policy: required | opt-in | opt-out` (`docs/skills-protocol.md` §2).
- Linter findings flow back to the agent *"as a system reminder for self-correction"* — `craft/README.md` (Enforcement levels). So the checklist P0 gate (Step 4 of the mobile-app workflow) is the per-screen quality gate.

### 7.4 State coverage — the craft requirement the mobile-app skill pulls in

Because the mobile-app template declares `craft.requires: [state-coverage, animation-discipline]`, every render is expected to cover the five required states (`craft/state-coverage.md`): **Loading** (skeleton/spinner + 15s fallback), **Empty** (headline + explanation + primary CTA; "Empty is not the absence of state. It is its own state with a job."), **Error** (what happened → why → what the user can do; preserve input), **Populated**, **Edge** (extreme volume, long strings, missing optional fields…). *"The single most reliable AI-design failure is shipping only the populated state."* For Spen this maps directly to the brief's required states (empty/loading/over-budget/defisit/goal tercapai/error).

### 7.5 Cost / credit management signals

- Prototype runs are per-screen; the workflow is *"clarify brief → resolve design tokens → write component tree → write file"* — one run per screen (`docs/skills-protocol.md` §4.1). Planning-heavy multi-turn discovery is discouraged by the default router (route first, ask only when materially ambiguous — §4.1).
- Oversized runs are guarded with an explicit remedy: the `AGENT_PROMPT_TOO_LARGE` error *"telling the user to reduce skills/design-system context, shorten the conversation, or pick an adapter with stdin support"* — `docs/agent-adapters.md` §5.11 (DeepSeek argv guard; the same budget discipline applies to prompt size generally). Keep DESIGN.md and the per-screen brief lean.
- The contract-check doc frames the general principle of not burning LLM tokens without review: *"Putting this on a cron would burn LLM tokens every run with no human review of the output, defeating the point."* — `docs/MOCKS-CONTRACT-CHECK.md` (about its own maintenance ritual, but the stated principle — review before you spend — matches the refine-then-render loop).
- Spen guide (project-local, aligned): *"JANGAN pakai plan mode di agent design (boros credit/limit free tier) — langsung build"* and *"Hemat credit: refine via point-and-edit / edit code, bukan regenerate dari nol."* — `docs/design/open-design-guide.md` §7.

---

## Appendix A — Primary source index (all raw URLs)

| Source | URL |
|---|---|
| README | `https://raw.githubusercontent.com/nexu-io/open-design/main/README.md` |
| mobile-app SKILL.md | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-templates/mobile-app/SKILL.md` |
| mobile-app seed template.html | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-templates/mobile-app/assets/template.html` |
| mobile-app layouts.md | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-templates/mobile-app/references/layouts.md` |
| mobile-app checklist.md | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-templates/mobile-app/references/checklist.md` |
| mobile-app example.html | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-templates/mobile-app/example.html` |
| Skills protocol | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/skills-protocol.md` |
| Design-system authoring guide | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/design-systems.md` |
| Design systems README | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-systems/README.md` |
| Architecture | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/architecture.md` |
| Agent adapters | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/agent-adapters.md` |
| Modes | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/modes.md` |
| Token schema | `https://raw.githubusercontent.com/nexu-io/open-design/main/packages/contracts/src/design-systems/token-schema.ts` |
| default DESIGN.md (Neutral Modern) | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-systems/default/DESIGN.md` |
| default tokens.css | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-systems/default/tokens.css` |
| linear-app manifest.json | `https://raw.githubusercontent.com/nexu-io/open-design/main/design-systems/linear-app/manifest.json` |
| Craft README | `https://raw.githubusercontent.com/nexu-io/open-design/main/craft/README.md` |
| Craft: color | `https://raw.githubusercontent.com/nexu-io/open-design/main/craft/color.md` |
| Craft: typography | `https://raw.githubusercontent.com/nexu-io/open-design/main/craft/typography.md` |
| Craft: anti-ai-slop | `https://raw.githubusercontent.com/nexu-io/open-design/main/craft/anti-ai-slop.md` |
| Craft: state-coverage | `https://raw.githubusercontent.com/nexu-io/open-design/main/craft/state-coverage.md` |
| Craft: animation-discipline | `https://raw.githubusercontent.com/nexu-io/open-design/main/craft/animation-discipline.md` |
| Scenario: od-default | `https://raw.githubusercontent.com/nexu-io/open-design/main/plugins/_official/scenarios/od-default/SKILL.md` |
| Scenario: od-design-refine | `https://raw.githubusercontent.com/nexu-io/open-design/main/plugins/_official/scenarios/od-design-refine/SKILL.md` |
| Scenario: od-react-export | `https://raw.githubusercontent.com/nexu-io/open-design/main/plugins/_official/scenarios/od-react-export/SKILL.md` |
| DESIGN.sample.md (9-section legacy) | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/examples/DESIGN.sample.md` |
| Design-system tracking spec (archived) | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/design-system-tracking-spec.md` |
| MOCKS contract check | `https://raw.githubusercontent.com/nexu-io/open-design/main/docs/MOCKS-CONTRACT-CHECK.md` |

*First-party product/docs site referenced by the repo: https://open-design.ai/ (download, pricing, install scripts, DeepSeek harness).*

## Appendix B — Key facts most relevant to the Spen project (tl;dr)

- Desktop app on Windows + Codex runs as `codex exec --json --skip-git-repo-check` with `danger-full-access` sandbox on Windows; the **project workspace is the agent's working directory**; skills are staged as real copies under `<project-cwd>/.od-skills/`.
- Every render composes: `USAGE.md` → full `DESIGN.md` → `tokens.css` → components → craft (`state-coverage`, `animation-discipline`) → mobile-app skill body. **DESIGN.md is the single lever for cross-screen consistency.**
- One render = one screen = one `index.html` in the project root; the agent must replace the six seed `:root` vars (`--bg --surface --fg --muted --border --accent`) with the design system's tokens and keep the frame untouched (390×844, 56px device / 44px screen radius, Dynamic Island, SVG status bar, home indicator).
- The Spen tab bar is 5 slots with a center "＋" — the seed's 4-tab default must be extended (define the extra style in the seed's `<style>`; the class-inventory rule permits this).
- Light + dark = two frames for the mobile-app template (seed is single-theme); the tokens.css contract supports `[data-theme="dark"]` overrides for the design system package itself.
- Record concrete values back by keeping `DESIGN.md` prose and `tokens.css` synchronized (docs/design-systems.md §3), ideally in a `design-systems/spen/` package (`manifest.json` + `DESIGN.md` + `tokens.css`); the daemon's derived files (`design-tokens.json`, `tailwind-v4.css`) regenerate from `tokens.css`.
- Iterate with the refine plugin semantics: pick one direction (clarity/hierarchy/polish/accessibility/responsiveness/fidelity), smallest useful patch, critique against DESIGN.md — never full regeneration; run the P0 checklist as the pre-emit gate.
