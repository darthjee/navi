# Plan: Add examples

Issue: [751-add-examples.md](../../issues/751-add-examples.md)

## Overview

Introduce two independent "samples" subtrees — one per top-level guide — of end-to-end,
copy-paste usage recipes:

| Guide (TOC gets a `Samples` row) | Index | Recipe files |
|----------------------------------|-------|--------------|
| `docs/guides/how_to_use_navi.md` | `docs/guides/navi/samples.md` | `docs/guides/navi/samples/*.md` (9 engine recipes) |
| `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` | `docs/guides/navi-client/samples.md` | `docs/guides/navi-client/samples/*.md` (4 client recipes) |

Every recipe follows one shared template and embeds the full YAML / JS / shell it
illustrates. The existing engine feature guides gain a one-line `Related sample:` pointer.
No link crosses between the `navi/` and `navi-client/` subtrees.

All work is inside the `docs` agent's scope (`README.md`, `docs/guides/how_to_use_navi.md`,
`docs/guides/navi/*.md`, `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`,
`docs/guides/navi-client/*.md`). No source, client, or engine code changes.

## Context

From the issue and codebase exploration:

- The engine guide tree (`docs/guides/navi/`) already has feature-reference pages with YAML
  fragments: `prerequisites.md`, `paginated-actions.md`, `emit-configuration.md`,
  `warming-html-assets.md`, `splitting-configuration.md`, `reference.md`, plus four
  integration-option pages. The client guide tree (`docs/guides/navi-client/`) has
  `installation.md`, `library-usage.md`, `cli-usage.md`, `reference.md`.
- Both top-level guides carry a `## Table of Contents` bullet list of the form
  `- [Title](./navi/x.md) — one-line description.`, ending with a `Reference` row.
- Every `docs/guides/navi/*.md` page ends with `[← Back to How to Use Navi](../how_to_use_navi.md)`;
  every `docs/guides/navi-client/*.md` page ends with
  `[← Back to How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md)`.
- All features these recipes use are already shipped and documented — this issue only adds
  goal-oriented recipes, it does not change any config surface.

## Sample authoring conventions

Apply these to every recipe file created in steps 01–04:

1. **File shape** (from the issue):

   ```markdown
   # <Scenario title>

   <One sentence: what this recipe achieves and when you'd reach for it.>

   ## Scenario

   <2–4 sentences: concrete setup and what success looks like.>

   ## Configuration        (engine recipes)
   ## Code / ## Command     (client recipes: library / CLI)

   <A complete, copy-pasteable YAML / JS / shell snippet — no elisions.>

   ## What happens

   <Trace the outcome with concrete example values, in the style of
   `paginated-actions.md` ("returns { pagination: { pages: 3 } }" → "enqueues pages 1–3").>

   ## Notes

   <Optional. Gotchas and a pointer to the matching same-subtree feature guide.>

   ---
   [← Back to Samples](../samples.md)
   ```

2. **Engine run line**: use `npx navi-hey --config navi_config.yml` (matches
   `option-b-nodejs-image.md`). The binary is `navi-hey`, not `navi`; the `-c` / `--config`
   flag overrides the default `config/navi_config.yml`. Do **not** invent a `navi` command.
3. **Headless for CI**: any engine recipe aimed at a pipeline omits the top-level `web:` key
   so Navi exits once the queue drains (see `reference.md`).
4. **Path expressions**: always `parsedBody.<field>` (camelCase — `parsed_body` throws at
   runtime); response-header keys are lowercase (`headers['x-per-page']`). Call this out in
   `resource-chaining.md` and `paginated-warmup.md`.
5. **Mirror existing syntax**: copy field names and YAML/JS shapes verbatim from the
   matching feature guide — never introduce syntax not already present in
   `docs/guides/navi/*` or `docs/guides/navi-client/*`.
6. **English only** (AGENTS.md).
7. **No cross-subtree links**: a recipe or index under `navi/` links only within `navi/`;
   likewise for `navi-client/`.

## Steps

- [01 — Engine cache-warmup recipes](docs/01-engine-cache-warmup-samples.md)
- [02 — Engine crawling recipes](docs/02-engine-crawling-samples.md)
- [03 — Engine samples index](docs/03-engine-samples-index.md)
- [04 — Client recipes and index](docs/04-client-samples-and-index.md)
- [05 — Wire `Samples` into the two guide TOCs](docs/05-wire-guide-toc-links.md)
- [06 — Feature-guide "Related sample" back-links](docs/06-feature-guide-related-sample-backlinks.md)

## Notes

- No CI job covers `docs/` — `.circleci/config.yml` scopes every `jasmine*`/`checks*` job to
  `source`, `dev/*`, `frontend`, `clients/node`, or `worker`, and there is no markdown lint
  or link checker. Nothing to run locally; review is by reading.
- Sample YAML/JS is illustrative and unvalidated by tooling — reviewers should sanity-check
  every field name against the matching feature guide.
- Keep `basic-warmup.md` minimal (no `failure`/`workers` tuning); `ci-failure-threshold.md`
  is the "CI hardening" variant that adds `failure.threshold` and worker tuning.
- `resource-chaining.md` exercises `actions`, which has no dedicated feature guide (it lives
  in `prerequisites.md`), so step 06 adds no back-link for it — consistent with the issue's
  "guides that have a matching sample".
- Issue/plan file naming uses hyphens (`751-add-examples`), not the underscore form in some
  older AGENTS.md examples — follow the paths the tooling produced.
