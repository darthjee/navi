# Plan: Update how to use client

Issue: [642-update-how-to-use-client.md](../issues/642-update-how-to-use-client.md)

## Overview

`docs/guides/HOW_TO_USE_NAVI-CLIENT.md` is the thin top-level index page for `navi-hey-client`. PR #641 (fixing #632) added file/YAML-based config loading to the client — `configFromFiles`/`configFromJson`/`configFromYaml` in the library, `--file`/`--json`/`--yaml` in the CLI — and fully documented it in the linked sub-guides (`docs/guides/navi-client/{cli-usage,library-usage,reference}.md`), but never mentioned it on the top-level page itself. This plan adds a short, matter-of-fact mention of that capability to the top-level page, with one library example and one CLI example, plus the minimum client version that supports it — without turning the page into anything more than the thin index it already is.

## Context

- `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` is 16 lines: an intro (what `navi-hey-client` is, what the `/api/*` namespace does, who the guide is for), a `---`, and a Table of Contents linking to `installation.md`, `library-usage.md`, `cli-usage.md`, `reference.md`.
- The file/YAML config-loading feature shipped in `navi-hey-client` `0.1.1` (via commit `555ea7b1f6ed74e9e0e6067f87a31cdd9e6cafd2`, PR #641). Confirm this is still the current `clients/node/package.json` version at implementation time; if it has since bumped, the version quoted on the page should reflect whichever version this shipped in, not just "current".
- The mention must **not** read as a "What's New"/changelog callout — write it as a normal part of describing what the client can do, since first-time readers have no prior version to compare against. It should, however, note that the capability requires `navi-hey-client >= 0.1.1`, since readers who pin/lock an older client version in their own project won't have it.
- Both examples should be minimal — one line or two each — since the full detail already lives in `library-usage.md`/`cli-usage.md` and this page must stay a thin index, not a duplicate of that content.

## Implementation Steps

### Step 1 — Add the capability mention to the intro

In `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`, after the existing paragraph describing the `/api/*` namespace (`POST /api/config`, `POST /api/engine/start`, `POST /api/engine/stop`), add a short paragraph stating that `POST /api/config` payloads can either be built by hand or loaded directly from the same YAML/JSON config files a self-hosted Navi engine reads (`navi-hey-client >= 0.1.1`).

### Step 2 — Add one library example and one CLI example

Immediately under that paragraph, include:
- A minimal library snippet, e.g. `await client.configFromFiles(['./config/reports.yml']);`
- A minimal CLI snippet, e.g. `navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config --file ./config/reports.yml`

Keep both to a single line/command each — no explanation of grouping, env-var resolution, or the other `configFromJson`/`configFromYaml`/`--json`/`--yaml` variants; that detail stays in `library-usage.md`/`cli-usage.md`, which the Table of Contents already links to.

### Step 3 — Verify the page still reads as a thin index

Re-read the full file after editing: the intro should still flow naturally (not read as an inserted changelog entry), and the Table of Contents / overall length should stay close to its current shape — this page's job is to point to the sub-guides, not replace them.

## Files to Change

- `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` — add the capability mention, minimum version note, and the two minimal examples described above.

## Notes

- Owned entirely by the `docs` agent — no other agent has work on this issue (single file, no code/behavior change, no CI job covers markdown docs).
- Confirm the `>= 0.1.1` version number against `clients/node/package.json` at implementation time in case it has since bumped past the version this feature actually shipped in.
- Explicitly out of scope (per the issue): no broader doc-audit or process for keeping top-level pages in sync with sub-guides.
