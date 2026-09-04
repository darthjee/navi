# Issue: Demo navi-hey engine silently ignores its config (wrong config path baked into the Dockerfile)

## Description

The demo navi-hey engine (`https://navi-hey-demo.tamanduati.tech/`, the
`build-and-release-demo` Render service, project `navi-hey`) silently
ignores its own `navi-config.yml`. `dockerfiles/demo_navi_hey/Dockerfile`
copies that config to a file path the container's inherited `CMD` never
reads, so the engine boots on an empty default config instead.

## Problem

Visiting the demo shows no crawl activity: the dashboard reports 5 idle
workers, an empty queue, and no resources/links.

**Root cause.** `dockerfiles/demo_navi_hey/Dockerfile` is:

```dockerfile
FROM darthjee/navi-hey:<version>

COPY navi-config.yml /home/node/app/config/navi_config.yml
```

The base image `darthjee/navi-hey:<version>` is built from
`dockerfiles/production_navi_hey/Dockerfile`, which bakes in:

```dockerfile
ENV NAVI_CONFIG=./config/web.yml
...
CMD navi-hey -c $NAVI_CONFIG
```

Every container from this base image boots running `navi-hey -c
./config/web.yml` — inherited, and `demo_navi_hey/Dockerfile` never
overrides it. It copies the demo's real config to a **different** path
(`config/navi_config.yml`, not `config/web.yml`), so that file is silently
never read.

Instead, the container runs on the base image's own baked-in default,
`dockerfiles/production_navi_hey/config/web.yml`:

```yaml
web:
  port: $PORT
  logs_page_size: $LOGS_PAGE_SIZE
  enable_shutdown: $ENABLE_SHUTDOWN
  autostart: $AUTOSTART
  idle_timeout: $IDLE_TIMEOUT
  api:
    token: $API_TOKEN
workers:
  quantity: $WORKERS
  retry_cooldown: $RETRY_COOLDOWN
  sleep: $WORKERS_SLEEP
  max-retries: $MAX_RETRIES
resources: {}
clients: {}
```

This explains every observed symptom exactly:
- `workers.quantity: $WORKERS` still resolves to `5` (Render's `WORKERS=5`
  env var on the `navi-hey` project) -> **5 idle workers**, as seen.
- `resources: {}` / `clients: {}` are hardcoded empty -> **no resources, no
  links, empty queue**, as seen.
- The file is valid YAML and the app boots cleanly -> **no crashes in the
  logs**, as seen.

**What was ruled out.** Confirmed directly against the Render dashboard and
live env vars before finding the above:

- `build-and-release-demo` (`DEMO_RENDER_SERVICE_NAME`) -> Render project
  `navi-hey` -> correctly builds `dockerfiles/demo_navi_hey/` (the engine).
- `build-and-release-demo-app` (`DEMO_APP_RENDER_SERVICE_NAME`) -> Render
  project `navi-demo-app` -> correctly builds `dockerfiles/demo_dev_app/`
  (the mock target app it is meant to crawl).
- All engine env vars are set with sane values: `BASE_URL=https://navi-dev-app.tamanduati.tech`,
  `WORKERS=5`, `RETRY_COOLDOWN=10000`, `MAX_RETRIES=50`, `TIMOUT=20000`,
  `LOG_LEVEL=info`.
- No crashes in the `navi-hey` service's logs; the `503`/`Retry-After` seen on
  a cold hit is expected free-tier spin-up behavior, not a bug.

So there was never a Render dashboard misconfiguration - both services build
the Dockerfile they are supposed to. The bug is entirely inside
`demo_navi_hey/Dockerfile` itself.

## Expected Behavior

After the fix and a redeploy, the `navi-hey` engine service loads the demo's
actual `navi-config.yml`: its dashboard shows the real resources/clients
defined there (the `default` client, `categories`/`items` resources,
`web.links`), and, once a crawl is triggered, real crawl activity against
the `navi-demo-app` mock target instead of the empty `resources: {}` /
`clients: {}` state seen today.

## Solution

Fix `dockerfiles/demo_navi_hey/Dockerfile` to explicitly point navi-hey at
the copied-in config, using its actual override mechanism
(`ENV NAVI_CONFIG`) instead of relying on silently matching the base image's
internal default path:

```dockerfile
FROM darthjee/navi-hey:<version>

COPY navi-config.yml /home/node/app/config/navi_config.yml
ENV NAVI_CONFIG=./config/navi_config.yml
```

This is preferred over simply overwriting `config/web.yml` in place: the
`ENV NAVI_CONFIG` override is navi-hey's actual public config mechanism, so
it is self-documenting and will not silently regress again if a future
`darthjee/navi-hey` version ever changes its internal default config path.

Also add a short `README.md` next to each demo Dockerfile
(`dockerfiles/demo_navi_hey/README.md`, `dockerfiles/demo_dev_app/README.md`)
documenting each image's purpose, the Render service that builds it, its
expected env vars, and - for `demo_navi_hey` specifically - *why* the
explicit `ENV NAVI_CONFIG` override exists, so this exact silent-mismatch
failure mode doesn't recur if someone "simplifies" the Dockerfile later.

`scripts/bump_version.sh` needs no change - it already correctly bumps this
Dockerfile's `FROM` tag on every release.

### Scope

- `oak` client target (`navi-config.yml`'s `oak` client, `base_url:
  $OAK_BASE_URL`) is out of scope - it has its own separate navi instance
  and deployment.
- No `render.yaml` Blueprint work here - see #774 for that (closed; its
  original rationale doesn't apply, since there was never a Render dashboard
  mapping problem).

### Edge cases

- **Silent empty `$VAR` interpolation.** `ConfigIncluder`'s
  `EnvStringResolver` resolves an unset referenced env var to `''` with just
  a `Logger.warn`, not a hard failure (see #753). Not the cause here (all
  relevant env vars are confirmed set), but worth keeping in mind for future
  debugging of this demo: a missing var wouldn't error, it would just leave
  something silently empty/idle.
- **Parallel deploy race.** `build-and-release-demo` and
  `build-and-release-demo-app` both only `requires: [build-and-release]`,
  with no dependency on each other, so they can deploy concurrently - the
  engine could come up before the mock-store app is reachable. This
  self-heals via the existing `retry_cooldown`/`max-retries` settings in
  `navi-config.yml`; no action needed.

### Acceptance criteria

- [ ] `dockerfiles/demo_navi_hey/Dockerfile` copies the config to
      `config/navi_config.yml` and sets `ENV NAVI_CONFIG=./config/navi_config.yml`.
- [ ] `dockerfiles/demo_navi_hey/README.md` documents the image's purpose,
      the Render service that builds it, its expected env vars, and why the
      `ENV NAVI_CONFIG` override exists.
- [ ] `dockerfiles/demo_dev_app/README.md` documents the image's purpose,
      the Render service that builds it, and its expected env vars.
- [ ] *(manual, external - not closeable by the PR)* After this ships and the
      `navi-hey` Render service redeploys, explicitly trigger a crawl via
      `/engine/start` (or `/engine/restart`) on
      `https://navi-hey-demo.tamanduati.tech/` and confirm the dashboard shows
      real resources/clients (matching `navi-config.yml`) and actual crawl
      activity - not the empty `resources: {}` / `clients: {}` state seen
      before the fix.

## Benefits

The public navi-hey demo actually demonstrates cache-warming in action
instead of sitting permanently idle, and the documented `ENV NAVI_CONFIG`
override prevents this exact silent-mismatch failure mode from recurring if
the Dockerfile is ever "simplified" later.
