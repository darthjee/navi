# Issue: Update navi guide

## Description

Navi can now run as a long-running server exposing a token-secured `/api/*` namespace (config push, engine start/stop). `docs/guides/HOW_TO_USE_NAVI.md` needs a new **Option D** documenting this integration mode alongside the existing Options A/B/C, plus a quick example of driving that hosted instance with `navi-hey-client`.

## Problem

Options A/B/C all follow the same shape: CI spins up (or installs) Navi, it runs headlessly, and the CI step blocks until the warm-up run finishes (the process exits once the job queue drains). There is no documented pattern for the case where Navi is instead hosted somewhere else as a long-running server, and an external caller (e.g. a CI step) just triggers a warm-up on it via `navi-hey-client` without waiting for that warm-up to complete — a materially different integration shape that the current guide doesn't cover.

## Solution

Add a new **Option D** to the guide covering the "hosted server + client" flow:

1. **Hosting the server** — `docker run -p 3000:3000 -e API_TOKEN=$TOKEN -e IDLE_TIMEOUT=0 darthjee/navi-hey:latest`. Briefly explain the two env vars that matter for this flow:
   - `API_TOKEN` — must be set to enable the token-secured `/api/*` namespace (empty disables it).
   - `IDLE_TIMEOUT` — `0` disables auto-shutdown (server stays up indefinitely); any other value is seconds of inactivity before shutdown.
   Link to Docker Hub (`darthjee/navi-hey` image page) and the existing [Reference](./navi/reference.md) for the rest of the env vars — don't repeat the full table here.

2. **Driving it with `navi-hey-client`** — two invocation patterns, each with a CI example:
   - Docker-run the client image directly in a CI step (`docker run --rm darthjee/navi-hey-client:latest navi-client ...`).
   - Use `darthjee/navi-hey-client:latest` as the CI executor image itself (mirroring Option C's pattern for `navi-hey`), so `navi-client` is callable directly with no `docker run` wrapper.
   Note that the image always ships a current version of the client (`npm install -g navi-hey-client@${CLIENT_VERSION}`, defaulting to `latest`).

3. **Example client call** — reuse the same shape already shown in `navi-client/cli-usage.md` (push a `resources`/`config` payload, then `engine-start`), pointed at the server hosted in step 1. Call out that `POST /api/engine/start` returns immediately with the transitional status — it does not wait for workers to finish (per `docs/agents/web-server.md`) — which is the key differentiator from Options A/B/C's blocking behavior.

4. Keep it brief — for anything beyond this, point to [How to Use navi-hey-client](../HOW_TO_USE_NAVI-CLIENT.md). Don't dig deep into client usage here; that's already covered by its own guide.

### Docs to update

- New file `docs/guides/navi/option-d-hosted-server.md` (or similar name), following the structure/tone of `option-a-docker-image.md`/`option-c-circleci-executor.md`.
- `docs/guides/HOW_TO_USE_NAVI.md`:
  - Table of Contents — add the new Option D entry.
  - Intro paragraph currently says "Two integration modes are covered" while already listing three (A/B/C) — reconcile this while touching it, now covering four.

### Explicitly out of scope

- Adding a CI-executor-image pattern to `navi-client/installation.md` itself — that pattern is introduced here in Option D only, scoped to this "host + drive" story, not as a general addition to the client's own docs.
- Any changes to the client library/CLI or the production Dockerfiles — this issue is documentation-only.

## Benefits

- Documents a fourth, already-supported integration mode (long-running hosted Navi + external client) that developers currently have no official guidance for.
- Makes the async, non-blocking nature of `/api/engine/start` explicit, helping developers pick the right option for their CI's constraints.
- Keeps client-usage depth appropriately scoped, avoiding duplication with the existing `navi-hey-client` guide.
