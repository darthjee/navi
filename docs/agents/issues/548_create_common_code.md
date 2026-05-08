# Issue: Create Common Code

## Description

`source/lib` and `dev/app/lib` share duplicated code that should live in a single location. The solution is to move the shared code into `source/lib/common/`, mount that folder into the dev app container via Docker Compose, and remove the duplicate files from `dev/app/lib`.

## Problem

- `utils/EnvResolver.js` is effectively identical in both `source/lib` and `dev/app/lib`.
- `utils/env_resolver/EnvStringResolver.js` exists in both locations with near-identical logic — the only difference is that `source` uses `Logger.warn` while `dev/app` uses `console.warn`.
- Any bug fix or enhancement must be applied twice, in two separate files and two sets of specs.

## Files to Consolidate

These are the only files that exist in both projects with identical or near-identical logic. All other `dev/app/lib` files are app-specific and have no counterpart in `source/lib`.

| Shared file | source path | dev/app path | Diff |
|-------------|------------|--------------|------|
| `EnvResolver.js` | `source/lib/utils/EnvResolver.js` | `dev/app/lib/utils/EnvResolver.js` | `@author` comment only |
| `EnvStringResolver.js` | `source/lib/utils/env_resolver/EnvStringResolver.js` | `dev/app/lib/utils/env_resolver/EnvStringResolver.js` | `Logger.warn` vs `console.warn` |

### Files to move to `source/lib/common/`

```
source/lib/utils/EnvResolver.js
  → source/lib/common/utils/EnvResolver.js

source/lib/utils/env_resolver/EnvStringResolver.js
  → source/lib/common/utils/env_resolver/EnvStringResolver.js
```

### Specs to move to `source/spec/lib/common/`

```
source/spec/lib/utils/EnvResolver_spec.js
  → source/spec/lib/common/utils/EnvResolver_spec.js

source/spec/lib/utils/env_resolver/EnvStringResolver_spec.js
  → source/spec/lib/common/utils/env_resolver/EnvStringResolver_spec.js
```

### Files to delete from `dev/app/`

```
dev/app/lib/utils/EnvResolver.js
dev/app/lib/utils/env_resolver/EnvStringResolver.js
dev/app/spec/lib/utils/EnvResolver_spec.js
dev/app/spec/lib/utils/env_resolver/EnvStringResolver_spec.js
```

## Expected Behavior

- Common code lives in `source/lib/common/` and is the single source of truth.
- The dev app container mounts `source/lib/common/` as `dev/app/lib/common/` via Docker Compose — no file copying at runtime.
- `dev/app/lib` retains only app-specific code.
- Specs for common code live in `source/spec/` only — `dev/app/spec` specs for these files are removed.

## Solution

### Step 1 — Align implementations before moving

`EnvStringResolver.js` differs between source and dev/app (Logger vs console.warn). Unify to use `Logger` (already used in source) before extracting to common, so the shared version has a single consistent behaviour.

### Step 2 — Move files to `source/lib/common/`

```
source/lib/utils/EnvResolver.js              → source/lib/common/utils/EnvResolver.js
source/lib/utils/env_resolver/
  EnvStringResolver.js                       → source/lib/common/utils/env_resolver/EnvStringResolver.js
```

Move the corresponding specs:
```
source/spec/lib/utils/EnvResolver_spec.js           → source/spec/lib/common/utils/EnvResolver_spec.js
source/spec/lib/utils/env_resolver/
  EnvStringResolver_spec.js                         → source/spec/lib/common/utils/env_resolver/EnvStringResolver_spec.js
```

### Step 3 — Update imports in source

All `source/lib` files that import from the moved modules must update their import paths to `../common/utils/...`.

Known callers:
- `source/lib/services/ConfigLoader.js` — imports `EnvStringResolver`
- `source/lib/utils/EnvResolver.js` (now at new path) — imports `EnvStringResolver`

### Step 4 — Mount common via Docker Compose

Add a volume binding in `docker-compose.yml` (or equivalent) for the dev app service:

```yaml
volumes:
  - ./source/lib/common:/app/lib/common
```

This makes `source/lib/common/` available inside the container as `dev/app/lib/common/` without any file copying.

### Step 5 — Update imports in dev/app

All `dev/app/lib` files that import from the moved modules update their paths to `../common/utils/...` (resolving to the mounted folder).

Known callers:
- `dev/app/lib/utils/EnvResolver.js` — to be removed entirely (code now lives in common)
- `dev/app/lib/config/AppConfig.js` — imports `EnvStringResolver`

### Step 6 — Remove duplicate files from dev/app

Delete:
- `dev/app/lib/utils/EnvResolver.js`
- `dev/app/lib/utils/env_resolver/EnvStringResolver.js`
- `dev/app/spec/lib/utils/EnvResolver_spec.js`
- `dev/app/spec/lib/utils/env_resolver/EnvStringResolver_spec.js`

### Step 7 — Update CI (`.circleci/config.yml`)

Before running the dev app test job, add a step to copy `source/lib/common/` into the dev app tree:

```bash
cp -r source/lib/common dev/app/lib/common
```

This is needed because CircleCI does not use Docker Compose volumes during test runs.

### Step 8 — Update deployment / demo build

When building the dev app Docker image for demo/deployment, ensure `source/lib/common/` is copied into the image at `app/lib/common/` (or the Docker Compose volume is present in the deployment environment).

## Benefits

- Single source of truth for shared utilities — fixes and enhancements apply once.
- Specs only written once, in `source/spec/lib/common/`.
- Clearer boundary: `dev/app/lib` contains only app-specific code.

---
See issue for details: https://github.com/darthjee/navi/issues/548
