# Plan: Add documentation on how to use navi

## Overview

Create `docs/HOW_TO_USE_NAVI.md` — a standalone guide for developers and AI agents who want to integrate Navi as a cache-warmer into their own projects. This is a documentation-only change; no source code is modified.

## Context

Navi is distributed as the Docker image `darthjee/navi-hey`. External projects can use it to warm HTTP caches as part of CI/CD pipelines or release workflows. Currently there is no document explaining how to do this. The issue requests at least two integration scenarios be documented:

1. Using the Docker image directly in a CI step.
2. Installing `navi-hey` in a Node.js-capable CI image and running it.

The existing `docs/HOW_TO_USE_DARTHJEE-TENT.md` serves as a style and depth reference.

## Implementation Steps

### Step 1 — Create `docs/HOW_TO_USE_NAVI.md`

Write the file with the following sections:

- **Introduction** — brief description of what Navi does and the two integration modes.
- **Prerequisites** — a minimal Navi YAML configuration file (explain key fields: `clients`, `resources`, absence of `web:` key to disable the web UI).
- **Option A — Docker image (`darthjee/navi-hey`)** — show a CI step (e.g. GitHub Actions / CircleCI YAML) that pulls the image, mounts the config file, and runs it headlessly.
- **Option B — Node.js image with `navi-hey` installed** — show how to install `navi-hey` via npm/yarn inside a Node.js-capable CI image and run it from the command line.
- **Reference** — key CLI flags / environment variables, if any.

## Files to Change

- `docs/HOW_TO_USE_NAVI.md` — new file (documentation only)
- `README.md` — add a link to `docs/HOW_TO_USE_NAVI.md` so readers know the guide exists
- `source/README.md` — same: add a link to the guide
- `DOCKERHUB_DESCRIPTION.md` — same: add a link to the guide

## Notes

- No source code, tests, or CI configuration need to change.
- The YAML config example should use the headless mode (no `web:` key), since both scenarios target CI without a web interface.
- CLI invocation details (flags, default config path) should be verified against `source/lib/services/ArgumentsParser.js` if needed.
- The link added to each README should make it clear that the guide is intended for both human developers and AI agents integrating Navi into other projects.
- All links must use the full GitHub URL: `https://github.com/darthjee/navi/blob/main/docs/HOW_TO_USE_NAVI.md`
