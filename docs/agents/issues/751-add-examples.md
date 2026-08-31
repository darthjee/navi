# Issue: Add examples

## Description

Add a curated set of "samples" — end-to-end, copy-paste usage recipes — to Navi's
guides. Each sample is its own `.md` file that embeds the code snippet or YAML config
body it illustrates, and is reachable from a per-guide `samples.md` index page. Two
independent samples subtrees are introduced, one under each top-level guide, with no
links crossing between them.

## Problem

The guides today document Navi feature-by-feature (`paginated-actions.md`,
`emit-configuration.md`, `warming-html-assets.md`, `splitting-configuration.md`, …).
Each guide explains one feature's fields and options in isolation, with a minimal
fragment example. There is no goal-oriented material showing how to combine those
features into a working configuration for a concrete task — so someone warming a
paginated API and emitting every extracted item has to assemble it themselves from
several reference pages. The `navi-hey-client` guide has the same gap on the client
side.

## Expected Behavior

- `docs/guides/how_to_use_navi.md` gains a table-of-contents link to `./navi/samples.md`,
  an index page listing self-contained engine recipes under `docs/guides/navi/samples/`.
- `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` gains a table-of-contents link to
  `./navi-client/samples.md`, an index page listing self-contained client recipes under
  `docs/guides/navi-client/samples/`.
- A first batch of 13 sample files (9 engine, 4 client) ships with this issue, each
  following one shared template and runnable/usable as-is.
- Each existing engine feature guide that has a matching sample gains a one-line
  `Related sample:` pointer to it.
- No link crosses between the `navi/` and `navi-client/` doc subtrees.

## Solution

### Scope

#### In scope

- **Two independent samples subtrees, one per top-level guide** — no cross-links between them:

  | Guide | Samples index | Sample files | Focus |
  |-------|---------------|--------------|-------|
  | `docs/guides/how_to_use_navi.md` | `docs/guides/navi/samples.md` | `docs/guides/navi/samples/*.md` | engine: cache warm-up and crawling, with YAML config bodies |
  | `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` | `docs/guides/navi-client/samples.md` | `docs/guides/navi-client/samples/*.md` | client: `navi-hey-client` library and CLI snippets |

- Each `samples.md` is an index page: short intro plus a table of contents linking only
  its own `samples/*.md` files.
- Add a link to the relevant `samples.md` from each guide's existing table of contents
  (`how_to_use_navi.md` → `./navi/samples.md`; `HOW_TO_USE_NAVI-CLIENT.md` →
  `./navi-client/samples.md`).
- Each sample file is self-contained — it embeds the code snippet or YAML body it
  illustrates, so it is useful to anyone reading it regardless of which guide they came
  from.
- Deliver **framework + a first batch of real sample content** for both subtrees in this
  issue (batch contents listed under "First batch of samples" below).

#### Out of scope (possible follow-ups)

- Making sample configs executable or validating them in CI.
- A repo-root runnable `samples/` tree of standalone config files.
- Rewriting or restructuring the existing feature guides
  (`paginated-actions.md`, `emit-configuration.md`, `warming-html-assets.md`, etc.).
- Any cross-linking between the `navi/` and `navi-client/` doc subtrees.

### Ownership

The `docs` agent owns this work — its scope already covers `README.md`,
`docs/guides/how_to_use_navi.md`, `docs/guides/navi/*.md`,
`docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, and `docs/guides/navi-client/*.md`, which is
exactly the set of files this issue touches. `docs/guides/navi/samples/` and
`docs/guides/navi-client/samples/` are nested doc folders, not new top-level folders.

### First batch of samples

"Crawling" here means the shipped extraction + `emit` feature set (`actions` /
`paginated_actions` parameter extraction plus `emit` sending items onward) — **not** the
future dedicated crawler under `docs/agents/future/crawler/`.

#### `docs/guides/navi/samples/` — engine samples

Cache warm-up:

| File | Scenario |
|------|----------|
| `basic-warmup.md` | Minimal headless config: one client, a flat list of URLs with expected statuses, run in CI. |
| `html-and-assets.md` | Warm HTML pages plus the CSS/JS they reference via `assets` selectors, including a separate CDN client. |
| `resource-chaining.md` | `actions` — fetch an index JSON, extract IDs, fan out to a detail resource using a named auth client. |
| `paginated-warmup.md` | `paginated_actions` — fan out one request per page from a `pages` count, forward `per_page` from a header, cap with `max_page`. |
| `split-config.md` | `include` + `namespace` — organise a large config across files with a cross-namespace reference. |
| `ci-failure-threshold.md` | `failure.threshold` plus worker tuning for a CI pipeline that should fail the build on too many dead jobs. |

Crawling:

| File | Scenario |
|------|----------|
| `emit-extracted-items.md` | Extract items from a JSON response and `emit` each one to an external endpoint (`POST`, expected `202`). |
| `emit-body-template.md` | Reshape/wrap the extracted item with `emit.body_template` (`{:.}`, nested paths, envelope). |
| `paginated-crawl-emit.md` | Combine `paginated_actions` + extraction + `emit` — crawl every page and emit every item. |

#### `docs/guides/navi-client/samples/` — client samples

| File | Scenario |
|------|----------|
| `push-config-and-start.md` | Library: hand-built `config()` payload, then `engineStart()` scoped via `targets`. |
| `config-from-files.md` | Library: `configFromFiles()` pointing at the same YAML/JSON the engine reads, one call per namespace, local `$VAR` resolution. |
| `cli-ci-warmup.md` | CLI: `--action engine-start` in a GitHub Actions / CircleCI step, using the Docker image. |
| `error-handling.md` | Handling `ApiRequestFailed` (`statusCode` / `url` / `body`) in both library and CLI. |

Total: 9 engine + 4 client = 13 sample files in the first batch.

### Sample file template

Every `samples/*.md` follows the same structure:

```markdown
# <Scenario title>

<One sentence: what this recipe achieves and when you'd reach for it.>

## Scenario

<2–4 sentences: the concrete setup — what the target app looks like, what you
want warmed/crawled, and what success looks like.>

## Configuration        (engine samples)
## Code / ## Command     (client samples: library / CLI)

<A complete, copy-pasteable YAML config / JS / shell snippet. No elisions — it
should run as-is against a matching app.>

## What happens

<Walk through the outcome: which requests Navi enqueues, in what order, what
gets emitted, what the exit behaviour is — using concrete example values, the
same style as `paginated-actions.md` ("returns { pagination: { pages: 3 } }" →
"enqueues pages 1–3").>

## Notes

<Optional. Gotchas, variations, and a pointer to the relevant feature guide in
the same subtree for the full field reference.>

---
[← Back to Samples](../samples.md)
```

Rules:

- Snippets are complete and self-contained — a sample must be useful read on its own.
- Engine samples include one short run line (e.g. `navi --config navi_config.yml`); they
  do not assume the reader picks that up from `how_to_use_navi.md`.
- "What happens" (not "Result") — it describes a process, not just an end state — and
  always traces behaviour with concrete example values.
- Footer links to `../samples.md` only. The index is what links back up to the top-level
  guide.
- The optional "Notes" section may link to same-subtree feature guides
  (`../paginated-actions.md`, `../emit-configuration.md`, …) to keep field-level detail in
  one place — this is within the subtree, not a cross-guide link.

### `samples.md` index format

Intro paragraph plus a table-of-contents matching the existing guide TOC style — each row
`[title](samples/file.md) — one-line description`:

- Engine `samples.md`: two sections, **Cache warm-up** and **Crawling**.
- Client `samples.md`: a single flat list.

The index links back up to its own top-level guide; the top-level guide's own TOC gains a
row pointing at `./navi/samples.md` / `./navi-client/samples.md` respectively.

### Samples vs. existing feature guides

The `navi/` subtree already has example-bearing feature guides
(`paginated-actions.md`, `emit-configuration.md`, `warming-html-assets.md`,
`splitting-configuration.md`). Division of labour:

| | Feature guides (existing) | Samples (new) |
|---|---|---|
| Organised by | one feature | one goal / scenario |
| Answers | "what does this feature do, and what are all its knobs?" | "how do I achieve X end-to-end?" |
| Content | full field tables, every option, edge cases, error semantics | complete runnable config + run line + concrete walk-through, minimal prose |
| Example scope | isolated fragment focused on the feature | end-to-end, usually combining several features, copy-paste-and-go |

Anti-duplication rules:

1. Samples do not re-document field semantics — the "Notes" section links to the feature
   guide's field table instead.
2. Existing feature guides are not trimmed, moved, or restructured; their focused examples
   stay as-is.
3. Where a sample overlaps a guide's existing example (e.g. `paginated-warmup.md` ↔
   `paginated-actions.md`), the sample earns its place by being complete and runnable (full
   `clients` block, run line, "what happens" with concrete values), not by adding new
   explanation.
4. This issue creates no new feature guides. If writing a sample reveals a feature with no
   guide, note it in the PR — do not expand scope.
5. Each existing feature guide that has a matching sample gains a single
   `**Related sample:** [link]` line pointing into `./samples/` (within the `navi/`
   subtree — a one-line addition, not a restructure) for forward discoverability. Guides
   with no matching sample are left untouched.

### Constraints

- The two guides and their subtrees stay strictly separated — a guide's `samples.md` and
  sample files link only within that guide's own subtree.
- This is a docs-only change; nothing existing is renamed or moved, so there is no
  backward-compatibility impact.

## Benefits

- Faster onboarding: a new user copies a whole working config for their scenario instead
  of stitching one together from several reference pages.
- The feature guides stay lean and reference-focused — recipes live in the samples tree
  rather than bloating each guide.
- Discoverability: `samples.md` in each guide's table of contents, plus `Related sample:`
  back-links from feature guides.
- A repeatable template and folder convention, so later samples can be added the same way.
