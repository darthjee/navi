# Issue: Docs: module-level README indexes + move the config schema out of README (token efficiency)

## Description

An automated token-efficiency review of Navi flagged two documentation gaps that make
agents (and people) read more than they need to in order to find their way around the code
and the configuration surface. They are unrelated in content but both are "read less to
learn the same thing" wins, so they are tracked here as one issue with two parts, each
with its own owning agent(s).

1. **No module-level index docs.** The big source trees — `source/lib/`, `worker/lib/`,
   `frontend/src/` — have no co-located `README.md` mapping what each immediate subfolder /
   notable file is for. An agent landing in one of those directories has to `ls` and open
   files to build a mental model, or go hunting for the relevant page under `docs/agents/`.
   Note: `source/README.md` and `worker/README.md` already exist, but they are the
   **npm-publish package readmes** (`navi-hey`, `deku-swarm`) — not module maps — and
   `frontend/` has no README at all. There is no precedent yet for a README *inside* these
   trees; this issue establishes one.
2. **The configuration schema is copied into four places.** The YAML config
   `Structure` + `Fields` reference lives, in varying states of completeness, in
   `README.md` (~150 lines, most complete), `source/README.md` (npm page — **stale**:
   missing `web.memory`, `web.api`, `clients.<name>.timeout`, `parser`, `emit`,
   `enabled`/`disabled`, `max_page`), `DOCKERHUB_DESCRIPTION.md` (Docker Hub page), and
   `docs/guides/navi/prerequisites.md` (already a "config structure + field-reference
   table", linked from the guide index). Anyone reading `README.md` for anything else pays
   the ~150-line cost; anyone who only wants the schema still has to load the whole README.

Owning agents:

| Part | Work | Owner |
|---|---|---|
| 1 | `source/lib/README.md` | **engine** |
| 1 | `worker/lib/README.md` | **worker** |
| 1 | `frontend/src/README.md` | **frontend** |
| 1 | back-links from `docs/agents/architecture/source-layout.md`, `docs/agents/worker.md`, `docs/agents/frontend.md`, `AGENTS.md` | **architect** |
| 2 | new `docs/guides/navi/configuration-schema.md`; trim `README.md` + `DOCKERHUB_DESCRIPTION.md`; fix README internal links; cross-link the new guide from `docs/guides/how_to_use_navi.md` and `docs/guides/navi/reference.md` | **docs** |
| 2 | trim `source/README.md` `## Configuration File` to a blurb + absolute link | **engine** |

No production code changes — this is `*.md` only, plus the small relative-link edits inside
`README.md`.

## Problem

### Part 1 — no module-level index docs

Current top-level shape of each target tree:

| Directory | Subdirs | Flat files | Existing prose (elsewhere) |
|---|---|---|---|
| `source/lib/` | 12 (`client`, `common`, `enqueuers`, `exceptions`, `jobs`, `models`, `parsers`, `registry`, `serializers`, `server`, `services`, `utils`) | 0 | `docs/agents/architecture/source-layout.md`, `docs/agents/folder-structure.md` |
| `worker/lib/` | 4 (`background`, `collections`, `generators`, `services`) | 2 (`Factory.js`, `index.js`) | `docs/agents/worker.md`, `docs/guides/deku-swarm/*` |
| `frontend/src/` | 4 (`clients`, `components`, `constants`, `utils`) | 1 (`main.jsx`) | `docs/agents/frontend.md` |

There *is* prose describing these trees, but it lives under `docs/agents/` — not where an
agent navigating the code actually is. There is no short "you are here" index at the root
of each tree, and nothing cross-linking the co-located view to the fuller `docs/agents/`
page.

### Part 2 — config schema copied four ways

`README.md` heading map (642 lines total):

```
91:  ## Configuration File
95:  ### Structure          (YAML example block)
176: ### Fields             (field-by-field tables: workers, log, failure, web, clients, resources, parser, emit)
242: ### Custom Configuration
257: ## Installation
```

`### Structure` + `### Fields` (lines ~95–241) are the schema reference. `### Custom
Configuration` (242–256) is about volume-mounting a config file into the Docker image —
deployment guidance, **not** schema — and stays put.

The same `Structure` + `Fields` block is duplicated in:

- **`source/README.md`** — the `navi-hey` npm package readme. Its `## Configuration File`
  section is a stale subset (see Description). Also carries its own `## Resource Chaining`
  / `## Paginated Actions` copies — *out of scope here*, schema block only.
- **`DOCKERHUB_DESCRIPTION.md`** — the Docker Hub listing (`## Configuration File`, lines
  ~66–175). Also carries `## Resource Chaining` / `## Paginated Actions` copies — *out of
  scope here*, schema block only.
- **`docs/guides/navi/prerequisites.md`** — already a config structure + field-reference
  table, already linked from `docs/guides/how_to_use_navi.md`. **Left as-is** this issue
  (see Solution); the new canonical doc does not replace it.

Internal links that point at the README schema content (all within `README.md`, no
external doc links reference these anchors):

- L31 ToC: `[Configuration File](#configuration-file)`
- L485: `See the [Configuration File Fields](#fields) table below ...`
- L87 / L307: `[Custom Configuration](#custom-configuration)` — unaffected, anchor stays.

`docs/guides/navi/reference.md` already exists (CLI flags + the production image's `ENV` →
config-field mapping) but does **not** contain the YAML schema / field tables.

## Solution

### Part 1 — co-located README index at the root of each tree

Create (each owned by that tree's specialist):

- `source/lib/README.md` — **engine**
- `worker/lib/README.md` — **worker**
- `frontend/src/README.md` — **frontend**

Each is a **short index, immediate children only** — not a duplicate of the `docs/agents/`
narrative:

- One line per immediate subfolder / notable flat file — what lives there, what it's
  responsible for. Do **not** recurse into nested sub-subdirs (`source/lib/models/`,
  `exceptions/`, `registry/`, …) — immediate children of `lib/` / `src/` only.
- A "See also" line linking to the fuller `docs/agents/` page(s) for that tree
  (`architecture/source-layout.md`, `worker.md`, `frontend.md`), so the co-located file
  stays a map and the narrative stays single-sourced.
- Terse enough that reading it is cheaper than `ls` + opening files.
- Match the tone of the existing top-level `source/README.md` / `worker/README.md` where
  relevant, but these are internal navigation aids, not package readmes — keep them lean.

Then (**architect**): add a back-link to each new co-located README from the matching
`docs/agents/` page (`architecture/source-layout.md`, `worker.md`, `frontend.md`) and note
the new convention in `AGENTS.md` (the `docs/agents/` table already lists the trees) so
the co-located and contributor-facing views are linked both ways.

### Part 2 — one canonical schema doc, trim the three duplicates

**docs:**

1. Create `docs/guides/navi/configuration-schema.md` as the canonical full schema: the
   `### Structure` YAML example plus every `### Fields` table — `workers`, `log`,
   `failure`, `web`, `web.memory`, `web.api`, `clients.<name>.*` (incl. `timeout`),
   `resources.<name>.*`, `enabled`/`disabled`, `max_page`, `actions` / `paginated_actions`,
   `assets`, `parser`, `emit`, `emit.size` / `extraction.size`, and the
   `GET /memory/status.json` response shape. Content is the **superset** of the README and
   `prerequisites.md` versions (README is more complete on `web.*` / `emit.size`;
   `prerequisites.md` is more complete on `disabled` / `max_page` / `parser` / `emit` and
   the `parsedBody` / `headers` / `parameters` namespace table). For `parser` / `emit`,
   summarize + link to the existing `extraction-configuration.md` / `emit-configuration.md`
   guides, the same way `prerequisites.md` does — don't re-expand them here.
2. In `README.md`, replace the body of `## Configuration File` (the `### Structure` and
   `### Fields` subsections, ~150 lines) with a brief pointer: one or two sentences plus a
   relative link to `docs/guides/navi/configuration-schema.md`. The `## Configuration File`
   heading stays (ToC entry L31 keeps working). Optionally keep a minimal ~5–10 line YAML
   skeleton for orientation — implementer's call. `### Custom Configuration` stays exactly
   where it is; its `#custom-configuration` anchor and the L87 / L307 links keep working.
3. In `README.md`, repoint L485 `[Configuration File Fields](#fields)` to the new guide.
4. In `DOCKERHUB_DESCRIPTION.md`, trim `## Configuration File` (`### Structure` +
   `### Fields`) to a short blurb + an **absolute** GitHub URL to the new guide
   (`https://github.com/darthjee/navi/blob/main/docs/guides/navi/configuration-schema.md`)
   — Docker Hub can't resolve relative links. Leave its `## Resource Chaining` /
   `## Paginated Actions` sections alone (out of scope).
5. Cross-link the new guide from `docs/guides/how_to_use_navi.md` (the guide index list)
   and from `docs/guides/navi/reference.md`, so it sits alongside the other navi guides.
   Leave `docs/guides/navi/prerequisites.md` unchanged — it stays a CI-oriented "minimum
   viable config" walkthrough; the new doc is the exhaustive reference.

**engine:**

6. In `source/README.md`, trim `## Configuration File` (`### Structure` + `### Fields`) to
   a short blurb + the same absolute GitHub URL to the new guide (npm's rendered readme
   can't resolve relative links). Leave its `## Resource Chaining` / `## Paginated Actions`
   sections alone (out of scope). This removes the stale copy rather than updating it.

### Validation

- `README.md` no longer contains the `### Fields` tables; `## Configuration File` is a
  short section with a working relative link to `docs/guides/navi/configuration-schema.md`.
- `source/README.md` and `DOCKERHUB_DESCRIPTION.md` no longer contain the `### Fields`
  tables; each has a blurb + absolute GitHub link to the new guide.
- `grep -rn '#fields' --include='*.md' .` returns no dead references (L485 repointed).
- `#custom-configuration` still resolves; L87 / L307 still work.
- The new guide is reachable from `docs/guides/how_to_use_navi.md` and
  `docs/guides/navi/reference.md`.
- `source/lib/README.md`, `worker/lib/README.md`, `frontend/src/README.md` exist, list
  every immediate child of that directory, link to the matching `docs/agents/` page, and
  do not recurse into nested dirs.
- The three `docs/agents/` pages link back to the new co-located READMEs; `AGENTS.md`
  notes the convention.
- Any markdown lint / link-check the repo runs in CI passes.

### Acceptance criteria

- [ ] `source/lib/README.md` added (engine) — one line per immediate child, "see also" →
      `docs/agents/architecture/source-layout.md`, no nested-dir recursion
- [ ] `worker/lib/README.md` added (worker) — indexes `background` / `collections` /
      `generators` / `services` + `Factory.js` / `index.js`, "see also" → `docs/agents/worker.md`
- [ ] `frontend/src/README.md` added (frontend) — indexes `clients` / `components` /
      `constants` / `utils` + `main.jsx`, "see also" → `docs/agents/frontend.md`
- [ ] Each new README is a terse index, not a restatement of the `docs/agents/` narrative
- [ ] `docs/agents/architecture/source-layout.md`, `docs/agents/worker.md`,
      `docs/agents/frontend.md` link back to the new co-located READMEs; `AGENTS.md` notes
      the convention (architect)
- [ ] `docs/guides/navi/configuration-schema.md` created (docs) — superset of the README
      and `prerequisites.md` field tables; `parser` / `emit` summarized with links out
- [ ] `README.md` `## Configuration File` reduced to intro + relative link; ~150 lines of
      schema removed; `### Custom Configuration` untouched (docs)
- [ ] `README.md` L485 `#fields` link repointed to the new guide; ToC + `#custom-configuration` still resolve (docs)
- [ ] `DOCKERHUB_DESCRIPTION.md` schema block trimmed to blurb + absolute GitHub link (docs)
- [ ] `source/README.md` schema block trimmed to blurb + absolute GitHub link — stale copy
      removed (engine)
- [ ] New guide cross-linked from `docs/guides/how_to_use_navi.md` and
      `docs/guides/navi/reference.md`; `prerequisites.md` left unchanged (docs)
- [ ] No dead in-repo markdown links introduced; CI doc/link checks green

## Benefits

- An agent (or contributor) opening `source/lib/`, `worker/lib/`, or `frontend/src/` gets
  an immediate, cheap map instead of listing directories and opening files to orient.
- Reading `README.md` for install/usage no longer drags in ~150 lines of schema tables;
  reading the schema no longer requires loading the whole README.
- The config schema exists in exactly one canonical place, cross-linked from the guide
  index — instead of four copies drifting out of sync (the `source/README.md` copy is
  already stale).
- The npm and Docker Hub readmes point readers at a single maintained reference rather
  than shipping their own decaying snapshots.
- Narrative stays single-sourced under `docs/agents/`; the new co-located files are thin
  indexes that link to it, so there's no second copy to drift.
