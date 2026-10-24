# Engine Plan: Rename worker/ folder to deku-swarm/

Main plan: [plan.md](plan.md)

## Shared contracts

- Rely on: the folder at `deku-swarm/` (worker agent) and the compose mount `./deku-swarm:/home/node/deku-swarm` (docker agent).
- Produce: `"deku-swarm": "file:../deku-swarm"` in `source/package.json`, plus regenerated lockfiles.

## Implementation Steps

### Step 1 — Switch the file: link and regenerate lockfiles
In `source/package.json`, change `"deku-swarm": "file:../worker"` to `"deku-swarm": "file:../deku-swarm"`. Regenerate `source/yarn.lock` and `source/package-lock.json` by running the install **inside the container** (e.g. `docker compose run --rm navi_app yarn install`, plus `npm install --package-lock-only` for `package-lock.json`). Don't hand-edit them. Expect the `"../worker"` entries to become `"../deku-swarm"`. The recorded `deku-swarm` version may also refresh (as in #1002).

## Files to Change
- `source/package.json` — `file:` link.
- `source/yarn.lock`, `source/package-lock.json` — regenerated.

## CI Checks
- `source`: `cd source && npm run coverage` (CI job: `jasmine`)
- `source`: `scripts/ci.sh lint-and-report source` (CI job: `checks`)

## Notes
- No code under `source/lib/` changes. "worker" in comments such as `ConfigLoader.js` ("worker/web/log sections") and the "per-worker" log buffers is a concept name, not a path. Leave it.
