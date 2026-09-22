# Dev Plan: Link source, the Node client and dev/app to deku-sprout and remove the old copies

Main plan: [plan.md](plan.md)

## Shared contracts

- `dev/app/package.json` declares `"deku-sprout": "file:../logger"` (matching `engine`'s local `file:` pattern, decided during issue discussion, not `navi-client`'s published-npm pattern).
- `Logger` imports switch to `import { Logger } from 'deku-sprout'`, the package's root entrypoint.
- Relies on `docker` adding a `./logger:/home/node/logger` mount to the `navi_dev_app` service in `docker-compose.yml`, and the equivalent `COPY ./logger/` step in `dockerfiles/demo_dev_app/Dockerfile`, for the new dependency to actually resolve.

## Implementation Steps

### Step 1 — Add the deku-sprout dependency and drop the jasmine exclusion

Add `"deku-sprout": "file:../logger"` to `dev/app/package.json`'s `dependencies`. Remove the `"!lib/common/utils/logging/**"` entry from its `jasmine.spec_files` array — the excluded path stops existing once `engine` deletes the corresponding files from `source/` (see Notes).

### Step 2 — Switch Logger imports to the package

`dev/app` only imports `Logger` (never `BaseLogger`/`ConsoleLogger`/`LoggerGroup` directly). Update `dev/app/lib/config/AppConfig.js`, `lib/handlers/CollectorHandler.js` and `lib/handlers/ContentHandler.js` from `import { Logger } from '../common/utils/logging/Logger.js'` to `import { Logger } from 'deku-sprout'`.

## Files to Change

- `dev/app/package.json` — add the `deku-sprout` dependency, drop the jasmine exclusion glob
- `dev/app/lib/config/AppConfig.js`, `lib/handlers/CollectorHandler.js`, `lib/handlers/ContentHandler.js` — import switch

## CI Checks

- `dev/app`: `npm run coverage` (job: `jasmine-dev`), `scripts/ci.sh lint-and-report dev/app` (job: `checks-dev`)

## Notes

- No edits are needed to `scripts/ci/setup-dev.sh`, the CircleCI "Copy common code from source" step, or the `docker-compose.yml` `./source/lib/common:/home/node/app/lib/common` mount: all three copy/mount `source/lib/common` wholesale (not scoped to `logging/`), and `source/lib/common` still has other content `dev/app` needs (`exceptions/`, `server/`, `utils/env_resolver/`, `utils/parser/`). Once `engine` deletes the logging subfolder from `source/`, it simply stops appearing under `dev/app/lib/common` on the next copy — no script change required.
- This step depends on `engine`'s deletion landing (for the excluded path to actually disappear) and `docker`'s `./logger:/home/node/logger` mount landing on `navi_dev_app` (for the new `file:../logger` dependency to resolve locally) — none of these are strictly ordered against each other, but the full change only works end to end once all three are in.
