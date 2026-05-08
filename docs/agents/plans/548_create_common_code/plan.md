# Plan: Create Common Code

## Overview

Move `EnvResolver` and `EnvStringResolver` — the only files duplicated between `source/lib` and `dev/app/lib` — into `source/lib/common/`. Wire everything so both projects consume from that single location: a Docker Compose volume mount for local dev, an explicit copy step in CircleCI for CI, and updated imports everywhere. Remove the duplicate files and specs from `dev/app`. Update the architecture docs to reflect the new shared module.

## Context

After comparing all files in both `lib/` trees, only two utilities are truly shared:

| File | Diff |
|------|------|
| `utils/EnvResolver.js` | `@author` comment only |
| `utils/env_resolver/EnvStringResolver.js` | `Logger.warn` (source) vs `console.warn` (dev/app) |

All other `dev/app/lib` files are app-specific and have no counterpart in `source/lib`.

## Implementation Steps

### Step 1 — Align `EnvStringResolver` implementations

Before moving, unify the two versions. The source version uses `Logger.warn`; the dev/app version uses `console.warn`. Since the common code will live inside `source/`, it can import `Logger` from `source/lib`. Keep `Logger.warn`.

No code change needed if the source version is already the canonical one — just verify the dev/app version will be deleted in Step 4.

---

### Step 2 — Move files to `source/lib/common/`

```
source/lib/utils/EnvResolver.js
  → source/lib/common/utils/EnvResolver.js

source/lib/utils/env_resolver/EnvStringResolver.js
  → source/lib/common/utils/env_resolver/EnvStringResolver.js
```

Move the corresponding specs:

```
source/spec/lib/utils/EnvResolver_spec.js
  → source/spec/lib/common/utils/EnvResolver_spec.js

source/spec/lib/utils/env_resolver/EnvStringResolver_spec.js
  → source/spec/lib/common/utils/env_resolver/EnvStringResolver_spec.js
```

Update the internal import inside `EnvResolver.js` (which imports `EnvStringResolver`) to reflect its new relative path.

---

### Step 3 — Update imports in `source/lib`

| File | Change |
|------|--------|
| `source/lib/services/ConfigLoader.js` | `../utils/env_resolver/EnvStringResolver.js` → `../common/utils/env_resolver/EnvStringResolver.js` |

---

### Step 4 — Delete duplicate files from `dev/app/`

```
dev/app/lib/utils/EnvResolver.js                          ← delete
dev/app/lib/utils/env_resolver/EnvStringResolver.js       ← delete
dev/app/spec/lib/utils/EnvResolver_spec.js                ← delete
dev/app/spec/lib/utils/env_resolver/EnvStringResolver_spec.js ← delete
```

---

### Step 5 — Update imports in `dev/app/lib`

| File | Change |
|------|--------|
| `dev/app/lib/config/AppConfig.js` | `../utils/env_resolver/EnvStringResolver.js` → `../common/utils/env_resolver/EnvStringResolver.js` |

`dev/app/lib/utils/EnvResolver.js` is deleted in Step 4, so any remaining callers of `EnvResolver.resolveObject` in dev/app must also update to `common/utils/EnvResolver.js`. Check for any other callers with `grep -r "EnvResolver" dev/app/lib`.

---

### Step 6 — Add Docker Compose volume mount

In `docker-compose.yml`, the dev app service currently mounts:

```yaml
- ./dev/app/:/home/node/app/
```

Add a second volume to overlay the common folder inside the container:

```yaml
- ./source/lib/common:/home/node/app/lib/common
```

This makes `source/lib/common/` available at `dev/app/lib/common/` inside the container without any file copying.

---

### Step 7 — Update CircleCI (`.circleci/config.yml`)

The `jasmine-dev` and `checks-dev` jobs run directly on a CI image (no Docker Compose). Add a copy step before `yarn install` in both jobs:

```yaml
- run:
    name: Copy common code from source
    command: |
      cp -r source/lib/common dev/app/lib/common
      cp -r source/spec/lib/common dev/app/spec/lib/common
```

Copying the specs ensures the dev/app coverage run also executes the common specs, preserving the coverage metric that was previously provided by the now-deleted `dev/app/spec` files.

Insert this as the first step after `checkout` in both `jasmine-dev` and `checks-dev`.

---

### Step 8 — Update `docs/agents/`

Two docs reference the moved files:

- **`docs/agents/architecture.md`** — update any file paths or module descriptions that reference `source/lib/utils/EnvResolver` or `env_resolver/`.
- **`docs/agents/dev-app.md`** — update to describe the new `common/` shared module, the Docker Compose volume mount, and the CI copy step.

---

## Files to Change

### Moved (rename/relocate)
- `source/lib/utils/EnvResolver.js` → `source/lib/common/utils/EnvResolver.js`
- `source/lib/utils/env_resolver/EnvStringResolver.js` → `source/lib/common/utils/env_resolver/EnvStringResolver.js`
- `source/spec/lib/utils/EnvResolver_spec.js` → `source/spec/lib/common/utils/EnvResolver_spec.js`
- `source/spec/lib/utils/env_resolver/EnvStringResolver_spec.js` → `source/spec/lib/common/utils/env_resolver/EnvStringResolver_spec.js`

### Updated (import paths)
- `source/lib/common/utils/EnvResolver.js` — internal import of `EnvStringResolver`
- `source/lib/services/ConfigLoader.js` — import of `EnvStringResolver`
- `dev/app/lib/config/AppConfig.js` — import of `EnvStringResolver`

### Deleted
- `dev/app/lib/utils/EnvResolver.js`
- `dev/app/lib/utils/env_resolver/EnvStringResolver.js`
- `dev/app/spec/lib/utils/EnvResolver_spec.js`
- `dev/app/spec/lib/utils/env_resolver/EnvStringResolver_spec.js`

### Infrastructure
- `docker-compose.yml` — new volume mount for common
- `.circleci/config.yml` — copy step in `jasmine-dev` and `checks-dev`

### Docs
- `docs/agents/architecture.md` — update file path references
- `docs/agents/dev-app.md` — document common module, volume mount, CI step

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `cd source; npm run coverage` (CircleCI job: `jasmine`)
- `dev/app/`: `cd dev/app; npm run coverage` (CircleCI job: `jasmine-dev`) — remember to `cp -r source/lib/common dev/app/lib/common` first

## Notes

- Steps 2–5 are a single atomic change — the code won't work until imports and files are all updated together. Do them in one commit.
- Steps 6 and 7 are independent of each other and can be done in the same or separate commits.
- After Step 4, run both test suites to confirm nothing broke before touching CI/Docker config.
- The `dev/app/lib/utils/` folder may become empty after the deletions — remove it if so.
- The demo app deployment (Render) uses the Docker image built by the Dockerfile; verify that the Dockerfile for the dev app also copies `source/lib/common` into the image at build time if it does not rely on Docker Compose volumes.
