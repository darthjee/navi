# Docker Plan: Demo navi-hey engine silently ignores its config (wrong config path baked into the Dockerfile)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Point navi-hey at the copied-in demo config

`dockerfiles/demo_navi_hey/Dockerfile` is `FROM darthjee/navi-hey:<version>`,
which is built from `dockerfiles/production_navi_hey/Dockerfile`. That
production Dockerfile bakes in `ENV NAVI_CONFIG=./config/web.yml` and
`CMD navi-hey -c $NAVI_CONFIG`, so every container from this base image boots
running `navi-hey -c ./config/web.yml`. `demo_navi_hey/Dockerfile` copies its
real config to a different path (`config/navi_config.yml`), which is never
referenced by that inherited `CMD` — the demo silently falls back to the base
image's own empty default config
(`dockerfiles/production_navi_hey/config/web.yml`, `resources: {}` /
`clients: {}`), explaining the observed idle workers / empty queue / no
resources.

Add an explicit `ENV NAVI_CONFIG` override after the `COPY` so the copied
file is what actually gets loaded — this uses navi-hey's real public config
mechanism instead of relying on silently matching the base image's internal
default path, so it won't regress again the same way if that internal
default ever changes:

```dockerfile
FROM darthjee/navi-hey:<version>

COPY navi-config.yml /home/node/app/config/navi_config.yml
ENV NAVI_CONFIG=./config/navi_config.yml
```

No change needed to `scripts/bump_version.sh` — it already correctly bumps
this Dockerfile's `FROM` tag on every release.

### Step 2 — Document both demo Dockerfiles

Add a short `README.md` next to each demo Dockerfile so the setup — and the
reason for the `ENV NAVI_CONFIG` override specifically — is explicit rather
than tribal knowledge:

- `dockerfiles/demo_navi_hey/README.md`: this image's purpose (the navi-hey
  engine for the public demo), the Render service that builds it
  (`build-and-release-demo` / `DEMO_RENDER_SERVICE_NAME`, Render project
  `navi-hey`), its expected env vars (`BASE_URL`, `WORKERS`,
  `RETRY_COOLDOWN`, `MAX_RETRIES`, `TIMOUT`, `LOG_LEVEL`), and *why* the
  `ENV NAVI_CONFIG` override in the Dockerfile exists (so a future edit
  doesn't quietly drop it and reintroduce this exact bug).
- `dockerfiles/demo_dev_app/README.md`: this image's purpose (the mock
  target store the demo engine crawls), the Render service that builds it
  (`build-and-release-demo-app` / `DEMO_APP_RENDER_SERVICE_NAME`, Render
  project `navi-demo-app`), and that it needs no config env vars beyond
  what's already baked into `dev/app/config.yml`.

## Files to Change

- `dockerfiles/demo_navi_hey/Dockerfile` — add `ENV NAVI_CONFIG=./config/navi_config.yml`.
- `dockerfiles/demo_navi_hey/README.md` — new file, per Step 2.
- `dockerfiles/demo_dev_app/README.md` — new file, per Step 2.

## Notes

- No CI job builds or tests either demo Dockerfile (`.circleci/config.yml`
  has no `docker build`/lint step touching `dockerfiles/`; Render builds them
  directly from the repo on deploy) — verification is manual: `docker build
  -f dockerfiles/demo_navi_hey/Dockerfile .` locally to confirm it still
  builds, and, after this ships and the `navi-hey` Render service redeploys,
  hitting `PATCH /engine/start` (or `/engine/restart`) on
  `https://navi-hey-demo.tamanduati.tech/` and confirming the dashboard shows
  real resources/clients instead of the empty `resources: {}` / `clients: {}`
  state seen before the fix. That live redeploy/verification step is manual
  and external — it's not something this PR itself can close.
- `oak` client target and any `render.yaml` Blueprint work are explicitly out
  of scope (see the issue's Scope section).
