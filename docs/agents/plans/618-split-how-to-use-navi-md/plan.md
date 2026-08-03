# Plan: Split HOW_TO_USE_NAVI.md

Issue: [618-split-how-to-use-navi-md.md](../../issues/618-split-how-to-use-navi-md.md)

## Overview

Split `docs/HOW_TO_USE_NAVI.md` (574 lines) into one file per section under a new `docs/navi/` folder, mirroring the existing `docs/tent/` split of `docs/HOW_TO_USE_DARTHJEE-TENT.md`. The index file is trimmed down to an intro + Table of Contents that links into `docs/navi/`. All new links are relative, every link resolves to a real file, `README.md`'s one anchor reference is updated, and the pre-existing dead link discovered in the `docs/tent/` split is also fixed.

## Context

`docs/HOW_TO_USE_NAVI.md` currently covers 8 largely independent topics in a single file: Prerequisites, three CI integration options (A/B/C), HTML asset warming, paginated actions, config splitting/namespacing, and a CLI/reference section. Loading the whole file costs tokens even when only one topic is needed — the same problem already solved for Tent's doc. The `docs/tent/` split establishes the pattern to follow:
- Each split file starts with a top-level `# <Title>` heading (not `##`).
- Each split file ends with a back-link line: `[← Back to <Index Title>](../<INDEX_FILENAME>.md)`.
- The index file keeps a short intro paragraph plus a `## Table of Contents` list, each entry linking to `./<subfolder>/<file>.md` with a one-line description after an em dash.

## Implementation Steps

### Step 1 — Create `docs/navi/` and split the content

Create `docs/navi/` and move each section of `docs/HOW_TO_USE_NAVI.md` into its own file, verbatim (only the top heading level and the trailing back-link change — content, code blocks, and tables stay exactly as they are today). Exact line ranges in the current file:

| New file | Source section | Current lines |
|---|---|---|
| `docs/navi/prerequisites.md` | `## Prerequisites` | 28–131 |
| `docs/navi/option-a-docker-image.md` | `## Option A — Docker image (\`darthjee/navi-hey\`)` | 134–181 |
| `docs/navi/option-b-nodejs-image.md` | `## Option B — Node.js image with \`navi-hey\` installed` | 183–238 |
| `docs/navi/option-c-circleci-executor.md` | `## Option C — CircleCI executor image` | 240–274 |
| `docs/navi/warming-html-assets.md` | `## Warming HTML pages and their assets` | 276–351 |
| `docs/navi/paginated-actions.md` | `## Paginated Actions` | 353–389 |
| `docs/navi/splitting-configuration.md` | `## Splitting Configuration Across Files` | 391–530 |
| `docs/navi/reference.md` | `## Reference` | 532–575 |

For each new file:
- Change the section's `## Heading` to a top-level `# Heading` (drop the `darthjee/navi-hey` backtick-quoting inconsistency only if it already existed at `##` level — keep wording otherwise identical).
- Drop the leading/trailing `---` horizontal-rule separators (those existed only to visually separate sections within the single monolithic file).
- Append a back-link line at the end: `[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)` (mirrors `docs/tent/quick-start.md`'s `[← Back to How to Use darthjee/tent](../HOW_TO_USE_DARTHJEE-TENT.md)`).

Verify there are no internal anchor cross-references between sections first (checked during planning — `grep -n '](#' docs/HOW_TO_USE_NAVI.md` only matches the ToC itself, lines 17–24, so no in-body section-to-section links need rewriting).

### Step 2 — Trim the index file

Replace `docs/HOW_TO_USE_NAVI.md` (currently lines 1–26 intro/ToC, everything after is now relocated) with:
- The existing title and intro paragraph (lines 1–11, unchanged).
- A `## Table of Contents` section where each entry links to `./navi/<file>.md` instead of `#<anchor>`, and gains a one-line description after an em dash — same shape as `docs/HOW_TO_USE_DARTHJEE-TENT.md`'s ToC. Example:
  ```markdown
  - [Prerequisites](./navi/prerequisites.md) — YAML config file structure, top-level keys, and field reference table.
  - [Option A — Docker image (`darthjee/navi-hey`)](./navi/option-a-docker-image.md) — Using the `darthjee/navi-hey` Docker image in a CI step.
  - [Option B — Node.js image with `navi-hey` installed](./navi/option-b-nodejs-image.md) — Installing and running the `navi-hey` npm package in a Node.js CI image.
  - [Option C — CircleCI executor image](./navi/option-c-circleci-executor.md) — Using `darthjee/navi-hey:latest` directly as the CircleCI executor image.
  - [Warming HTML pages and their assets](./navi/warming-html-assets.md) — Declaring an `assets` list so Navi also warms CSS/JS referenced by an HTML response.
  - [Paginated Actions](./navi/paginated-actions.md) — Fanning out one request per page with `paginated_actions`.
  - [Splitting Configuration Across Files](./navi/splitting-configuration.md) — Using `include` and `namespace` to organize config across multiple files.
  - [Reference](./navi/reference.md) — CLI flags, environment variable substitution, and headless vs. web UI mode.
  ```
- No other content remains in the index — everything else has moved to `docs/navi/`.

### Step 3 — Update `README.md`'s anchor reference

`README.md` line 42 currently links `.../docs/HOW_TO_USE_NAVI.md#splitting-configuration-across-files`. Update it to point directly at the relocated section: `https://github.com/darthjee/navi/blob/main/docs/navi/splitting-configuration.md`.

`source/README.md` and `DOCKERHUB_DESCRIPTION.md` link to the plain index URL with no anchor — leave those two untouched, they keep working as-is.

### Step 4 — Fix the pre-existing dead link in the Tent split

Two places currently link to a `creating-request-hashers.md` file that doesn't exist anywhere in the repo:
- `docs/HOW_TO_USE_DARTHJEE-TENT.md`'s ToC: `[Creating Request Hashers](./creating-request-hashers.md)`.
- `docs/tent/cache-configuration.md` line 148: `See [Creating Request Hashers](../creating-request-hashers.md) for the full \`RequestHasher\` interface, security guidance, and a complete custom-hasher example.`

No content for this page exists anywhere in the repo or its history to relocate — this looks like a page that was planned but never authored when the Tent doc was originally split. Authoring accurate technical content about Tent's `RequestHasher` PHP interface is out of scope for this issue (Tent is a separate external project); fabricating it risks being wrong. Resolve the dead link conservatively:
- Remove the ToC entry in `docs/HOW_TO_USE_DARTHJEE-TENT.md` and the link + trailing sentence in `docs/tent/cache-configuration.md` (keep the rest of that paragraph, which already explains the `request_hasher` option and shows two working examples — the removed sentence was only pointing to supplementary depth, not core information).
- Note as an aside in this plan (not a new issue) that if the maintainer wants that content written, it should reference the `darthjee/tent` repo's own documentation rather than being authored here, since this repo has no source-of-truth for Tent's internals.

### Step 5 — Verify no dead links

After all edits, check every relative markdown link under `docs/HOW_TO_USE_NAVI.md`, `docs/navi/*.md`, `docs/HOW_TO_USE_DARTHJEE-TENT.md`, and `docs/tent/*.md` resolves to a file that exists on disk (e.g. `grep -oE '\]\(\.[^)]+\)' <files>` and check each target with `test -f`, resolving `..`/`.` relative to each source file's directory).

## Files to Change

- `docs/HOW_TO_USE_NAVI.md` — trim to intro + Table of Contents linking into `docs/navi/`.
- `docs/navi/prerequisites.md` — new file, `## Prerequisites` content (lines 28–131 of the current doc).
- `docs/navi/option-a-docker-image.md` — new file, `## Option A` content (134–181).
- `docs/navi/option-b-nodejs-image.md` — new file, `## Option B` content (183–238).
- `docs/navi/option-c-circleci-executor.md` — new file, `## Option C` content (240–274).
- `docs/navi/warming-html-assets.md` — new file, `## Warming HTML pages and their assets` content (276–351).
- `docs/navi/paginated-actions.md` — new file, `## Paginated Actions` content (353–389).
- `docs/navi/splitting-configuration.md` — new file, `## Splitting Configuration Across Files` content (391–530).
- `docs/navi/reference.md` — new file, `## Reference` content (532–575).
- `README.md` — update the `#splitting-configuration-across-files` anchor link (line 42) to point at `docs/navi/splitting-configuration.md`.
- `docs/HOW_TO_USE_DARTHJEE-TENT.md` — remove the dead `Creating Request Hashers` ToC entry.
- `docs/tent/cache-configuration.md` — remove the dead `Creating Request Hashers` link/sentence at line 148.

## Notes

- `source/README.md` and `DOCKERHUB_DESCRIPTION.md` need no changes — their links have no anchor and keep resolving to the trimmed index.
- This is a documentation-only change with no code, tests, or CI job affected — no `## CI Checks` section applies.
- Whoever implements this should double check the exact line numbers above against the current state of `docs/HOW_TO_USE_NAVI.md` at implementation time, in case the file has drifted since this plan was written.
