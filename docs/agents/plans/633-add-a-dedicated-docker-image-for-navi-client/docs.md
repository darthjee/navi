# Docs Plan: Add a dedicated docker image for navi client

Main plan: [plan.md](plan.md)

## Shared contracts

- **Image name/tags**: `darthjee/navi-hey-client:latest` and `darthjee/navi-hey-client:<version>` — produced by the `docker`/architect work; use these exact names in every example.
- **Default container command**: `CMD navi-client`, **no `ENTRYPOINT`** — every `docker run`/CircleCI `run:` example must spell out `navi-client` explicitly as part of the command (never rely on it being implicit).
- **CLI flags** (already existing, unchanged): `--base-url/-b`, `--token/-t`, `--action/-a`, `--payload/-p`.
- **Docker Hub description file path**: `DOCKERHUB_DESCRIPTION_CLIENT.md` at repo root — this exact filename is referenced by the architect's `scripts/update-description-client.sh`; do not rename without updating `plan.md`'s root-level section too.

## Implementation Steps

### Step 1 — Add a "Docker Image" section to the installation guide

In `docs/guides/navi-client/installation.md`, add a new section after the existing npm/`npx` section (before the "← Back to How to Use navi-hey-client" link), covering:

- A link to the `darthjee/navi-hey-client` image on Docker Hub.
- A note that the image's default command is `navi-client` itself (`CMD navi-client`, no `ENTRYPOINT`), so it must be named explicitly in every invocation — e.g. `docker run --rm darthjee/navi-hey-client:latest navi-client --base-url http://localhost:3000 --token $NAVI_API_TOKEN --action engine-stop`.
- A GitHub Actions example (mirroring `docs/guides/navi/option-a-docker-image.md`'s style), e.g.:

  ```yaml
  jobs:
    warm-cache:
      runs-on: ubuntu-latest
      steps:
        - name: Warm cache with Navi client
          run: |
            docker run --rm darthjee/navi-hey-client:latest \
              navi-client --base-url https://your-app.example.com \
              --token ${{ secrets.NAVI_API_TOKEN }} \
              --action engine-start
  ```

- A CircleCI example using the image as the job's **primary executor** (mirroring `docs/guides/navi/option-c-circleci-executor.md`, not `docker run` + `setup_remote_docker` — this is the real-world driving use case, since it gives the job direct filesystem access to checked-out files with no Docker-in-Docker):

  ```yaml
  jobs:
    warm-cache:
      docker:
        - image: darthjee/navi-hey-client:latest
      steps:
        - checkout
        - run:
            name: Warm cache with Navi client
            command: navi-client --base-url https://your-app.example.com --token $NAVI_API_TOKEN --action engine-start
  ```

Keep the existing npm/`npx` section untouched above this new one.

### Step 2 — Create the Docker Hub description file

Create `DOCKERHUB_DESCRIPTION_CLIENT.md` at repo root, adapting `clients/node/README.md` to the Docker Hub context the same way the existing `DOCKERHUB_DESCRIPTION.md` adapts the app's README/docs. Structure:

1. Title + the same repo-wide badges as `DOCKERHUB_DESCRIPTION.md` (Codacy grade, Codacy coverage, CircleCI build — these are repo-level, reuse verbatim).
2. **Overview** — what `navi-hey-client` is: a thin Node.js client (library + CLI) for Navi's token-secured `/api/*` HTTP namespace, wrapped in a ready-to-run Docker image.
3. **Quick Start** — the `docker run --rm darthjee/navi-hey-client:latest navi-client --base-url ... --token ... --action engine-stop` example, plus the CircleCI-primary-image example from Step 1 (same content, adapted to standalone-doc framing).
4. **CLI options table** — reuse the table from `clients/node/README.md`'s "CLI usage" section (`--base-url/-b`, `--token/-t`, `--action/-a`, `--payload/-p`).
5. **Source & Documentation** — link to the GitHub repo (`https://github.com/darthjee/navi`) and to `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`.

### Step 3 — Add a Makefile table row to the root README

In `README.md`'s "Available Makefile commands" table (currently at `README.md:311-319`), add a row for the new `make build-client` target, directly below the existing `make build` row:

```markdown
| `make build-client` | Builds the production client Docker image (`darthjee/navi-hey-client:latest`). |
```

Leave the rest of `README.md` untouched — full client install/usage documentation continues to live in `clients/node/README.md` and `docs/guides/navi-client/`.

## Files to Change

- `docs/guides/navi-client/installation.md` — add the "Docker Image" section (Step 1).
- `DOCKERHUB_DESCRIPTION_CLIENT.md` — new file (Step 2).
- `README.md` — add one row to the Makefile commands table (Step 3).

## Notes

- The `docker run`/CircleCI examples here depend on the `docker` agent's Dockerfile actually shipping `CMD navi-client` (no `ENTRYPOINT`) — if that changes, every example in this plan that omits/includes `navi-client` explicitly needs to be re-checked.
- No CI job lints Markdown in this repo today, so these changes have no automated pre-merge check; proofread manually (rendered links, code block syntax) before opening the PR.
