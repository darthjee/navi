# Plan: update navi guide

Issue: [636-update-navi-guide.md](../../issues/636-update-navi-guide.md)

## Overview

Add a new **Option D** to `docs/guides/HOW_TO_USE_NAVI.md`: hosting `darthjee/navi-hey` as a long-running server and driving it externally via `navi-hey-client`, as opposed to Options A/B/C which all run Navi inside the CI job itself and block until the warm-up run finishes. This is a documentation-only change: one new split page plus updates to the main guide's intro and Table of Contents.

## Context

- `docs/guides/HOW_TO_USE_NAVI.md` currently documents Options A/B/C, all sharing the same shape: CI spins up (or installs) Navi, it runs headlessly, and the process/step blocks until the job queue drains.
- `docs/guides/navi/option-c-circleci-executor.md` shows the "declare the image as the job's executor" pattern for `darthjee/navi-hey` — Option D reuses this same pattern, but for `darthjee/navi-hey-client`.
- `docs/guides/navi/reference.md` documents the production `darthjee/navi-hey` image's env vars, including `API_TOKEN` (empty disables the `/api/*` namespace) and `IDLE_TIMEOUT` (`0` disables auto-shutdown, otherwise seconds of inactivity).
- `docs/guides/navi-client/installation.md` already documents `darthjee/navi-hey-client`'s basic `docker run` usage plus GitHub Actions/CircleCI examples that wrap it in `docker run` — but not the "image as CI executor" pattern (no `docker run` wrapper needed). That pattern is introduced only in Option D, per the issue's explicit scope note — `installation.md` itself is not touched by this plan.
- `docs/guides/navi-client/cli-usage.md` shows the config-push-then-`engine-start` example this plan's Option D example reuses.
- Per `docs/agents/web-server.md`, `POST /api/engine/start` shares semantics with `PATCH /engine/start`, whose lifecycle endpoints "return immediately with the transitional status and do not wait for workers to finish" — this is the fact backing Option D's "CI doesn't have to wait for warm-up to be considered done" framing. This is internal AI-agent documentation, not something to cite by path in the external-facing guide — state the fact in Option D's own words instead.

## Implementation Steps

### Step 1 — Create `docs/guides/navi/option-d-hosted-server.md`

Follow the tone/structure of `option-a-docker-image.md` and `option-c-circleci-executor.md` (short intro paragraph, then subsections with fenced code examples, ending with the standard `[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)` link). Content:

1. **Intro** — explain when to use this option: Navi is already hosted elsewhere as a long-running server, and an external caller (e.g. a CI step) just triggers a warm-up on it via `navi-hey-client`, without that CI step waiting for the warm-up itself to finish — unlike Options A/B/C, where the CI step blocks until the run completes.

2. **Hosting the server**:
   ```bash
   docker run -p 3000:3000 -e API_TOKEN=$TOKEN -e IDLE_TIMEOUT=0 darthjee/navi-hey:latest
   ```
   Briefly explain only the two env vars that matter for this flow:
   - `API_TOKEN` — must be set to enable the token-secured `/api/*` namespace (empty disables it, rejecting every request).
   - `IDLE_TIMEOUT` — `0` disables auto-shutdown (server stays up indefinitely); any other value is seconds of inactivity before shutdown.
   Link to the `darthjee/navi-hey` Docker Hub page and to [Reference](./reference.md) for the rest of the env vars — do not repeat the full table here.

3. **Driving it with `navi-hey-client`** — two invocation patterns, each with one CI example:
   - Docker-run the client image directly in a CI step, e.g.:
     ```yaml
     - name: Trigger warm-up
       run: |
         docker run --rm darthjee/navi-hey-client:latest \
           navi-client --base-url https://your-hosted-navi.example.com \
           --token $NAVI_API_TOKEN --action engine-start
     ```
   - Use `darthjee/navi-hey-client:latest` as the CI executor image itself, mirroring `option-c-circleci-executor.md`'s CircleCI pattern:
     ```yaml
     jobs:
       trigger-warm-up:
         docker:
           - image: darthjee/navi-hey-client:latest
         steps:
           - run:
               name: Trigger warm-up
               command: navi-client --base-url https://your-hosted-navi.example.com --token $NAVI_API_TOKEN --action engine-start
     ```
   Note that the image always ships a current version of the client (`npm install -g navi-hey-client@${CLIENT_VERSION}`, defaulting to `latest`, per `dockerfiles/production_navi_client/Dockerfile`).

4. **Example client call** — reuse the same shape already shown in `navi-client/cli-usage.md` (push a `resources`/`config` payload, then `engine-start`), pointed at the server hosted in step 2, e.g.:
   ```bash
   navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a config \
     -p '{"namespace":"reports","resources":{"categories":[{"url":"/categories.json","status":200}]}}'

   navi-client -b http://localhost:3000 -t $NAVI_API_TOKEN -a engine-start \
     -p '{"targets":[{"namespace":"reports"}]}'
   ```
   Call out that starting the engine this way returns immediately — the CI step that triggers it does not wait for the warm-up run itself to finish, unlike Options A/B/C.

5. Keep the page brief — for anything beyond this quick example, point to [How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md). Do not duplicate client installation/library/CLI details already covered there.

### Step 2 — Update `docs/guides/HOW_TO_USE_NAVI.md`

- Intro paragraph: change "Two integration modes are covered:" to "Four integration modes are covered:" (it already lists three — A/B/C — pre-existing drift to fix while touching this line) and add a fourth bullet:
  ```
  - **Option D** — host `darthjee/navi-hey` as a long-running server and drive it externally with `navi-hey-client`, without CI waiting for the warm-up run to finish.
  ```
- Table of Contents: add an entry after the Option C line:
  ```
  - [Option D — Hosted server + `navi-hey-client`](./navi/option-d-hosted-server.md) — Hosting `darthjee/navi-hey` as a long-running server and driving it via `navi-hey-client`, without CI blocking on the warm-up run.
  ```

## Files to Change

- `docs/guides/navi/option-d-hosted-server.md` — new
- `docs/guides/HOW_TO_USE_NAVI.md` — intro paragraph (mode count + new bullet) and Table of Contents

## Notes

- No CI job covers `docs/` (`.circleci/config.yml` lint jobs only cover `source/`, `dev/app`, `dev/frontend`, `frontend/`, `clients/node`), so no `## CI Checks` section applies here.
- Do not touch `docs/guides/navi-client/installation.md` — the CI-executor-image pattern for the client is introduced in Option D only, per the issue's explicit out-of-scope note.
- Do not touch `dockerfiles/` or any client library/CLI code — this issue is documentation-only.
