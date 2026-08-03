# Issue: Split HOW_TO_USE_NAVI.md

## Description
Split `docs/HOW_TO_USE_NAVI.md` into multiple smaller files, mirroring the precedent already established for `docs/HOW_TO_USE_DARTHJEE-TENT.md` (which was split into `docs/tent/*.md`), to reduce the token cost of loading the doc.

## Problem
`docs/HOW_TO_USE_NAVI.md` is a single 574-line file covering several largely independent topics (prerequisites, three separate CI integration options, HTML asset warming, paginated actions, config splitting/namespacing, and a CLI/env-var/web-UI reference). A reader or AI agent that only needs one of these topics still has to load the entire file, which is unnecessarily token-expensive — the same problem already solved for `docs/HOW_TO_USE_DARTHJEE-TENT.md` by splitting it into `docs/tent/*.md` behind a slim index.

## Expected Behavior
- `docs/HOW_TO_USE_NAVI.md` becomes a trimmed index: a short intro plus a Table of Contents, matching the shape of `docs/HOW_TO_USE_DARTHJEE-TENT.md`.
- Each current section of the doc becomes its own file under `docs/navi/`, linked from the index's Table of Contents.
- All links — index-to-file, file-to-index, and file-to-file — are relative, so they resolve correctly no matter where the repo is cloned.
- No link, in the new Navi docs or in the pre-existing Tent docs, points at a file that doesn't exist.
- Existing external references to `docs/HOW_TO_USE_NAVI.md` (from `README.md`, `source/README.md`, `DOCKERHUB_DESCRIPTION.md`) keep working after the split.

## Solution

### Directory/naming convention
Mirror the `docs/tent/` precedent exactly:
- Split files live under `docs/navi/<kebab-case-section>.md`.
- The index file stays at `docs/HOW_TO_USE_NAVI.md`, trimmed down to an intro + Table of Contents linking into `docs/navi/`, same shape as `docs/HOW_TO_USE_DARTHJEE-TENT.md`.

### Split structure
One file per existing Table of Contents entry (1:1 mapping):
- `docs/navi/prerequisites.md`
- `docs/navi/option-a-docker-image.md`
- `docs/navi/option-b-nodejs-image.md`
- `docs/navi/option-c-circleci-executor.md`
- `docs/navi/warming-html-assets.md`
- `docs/navi/paginated-actions.md`
- `docs/navi/splitting-configuration.md`
- `docs/navi/reference.md`

### Relative links
- The index (`docs/HOW_TO_USE_NAVI.md`) links into split files as `./navi/<file>.md`.
- Each split file links back to the index as `../HOW_TO_USE_NAVI.md`.
- Cross-links between split files within `docs/navi/` use `./<file>.md`.
- Acceptance criterion: every relative link in the new `docs/navi/` files and the trimmed index must resolve to a real file — no dead links.
- Also fix the pre-existing dead link in `docs/HOW_TO_USE_DARTHJEE-TENT.md`: `./creating-request-hashers.md` points to a file that doesn't exist anywhere under `docs/` (it should presumably be `./tent/creating-request-hashers.md`, or the content needs to be created/relocated).

### External references
- `DOCKERHUB_DESCRIPTION.md` and `source/README.md` link to the plain index URL (`.../docs/HOW_TO_USE_NAVI.md`, no anchor) — these keep working unchanged once the index is trimmed down, no edit needed.
- `README.md` additionally links an anchor, `docs/HOW_TO_USE_NAVI.md#splitting-configuration-across-files` (line 42), which breaks once that section moves out to `docs/navi/splitting-configuration.md`. Update that link to point directly at `https://github.com/darthjee/navi/blob/main/docs/navi/splitting-configuration.md`.

## Benefits
- Lower token cost for anyone (human or AI agent) who only needs a subset of the Navi usage doc.
- Consistent documentation structure across the two docs that already follow this split pattern.
- Removes a pre-existing dead link discovered while designing this split.
