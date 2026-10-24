# Logger Plan: Rename logger/ folder to deku-sprout/

Main plan: [plan.md](plan.md)

## Shared contracts

- You produce the folder `deku-sprout/` (was `logger/`), with identical content. Every other agent relies on it existing at that path.
- No change under `lib/`, and `package.json` keeps `"name": "deku-sprout"` and `"version": "0.3.0"`.

## Implementation Steps

### Step 1: Move the folder

Run `git mv logger deku-sprout` as the **first** change of the PR, so engine and dev can regenerate their lockfiles against the new path. Check that nothing inside the package refers to its own folder name: `eslint.config.mjs`, `spec/support/jasmine.json`, `README.md`, `yarn.lock`. A grep found only the concept use `Logger.setLogger(logger)` in `README.md`, which stays. Delete local build leftovers in the old path if they exist (`logger/node_modules`, `logger/coverage`, `logger/report` are not tracked).

### Step 2: Confirm the package still passes

Run the package's tests and lint from the new folder.

## Files to Change

- `logger/` → `deku-sprout/`: folder move only, no content change

## CI Checks

- `deku-sprout/`: `yarn test`, `yarn lint` (CI jobs `jasmine-deku-sprout`, `checks-deku-sprout`, whose `path:` the coordinator updates)

## Notes

- Your own agent definition is renamed to `deku-sprout` by the coordinator at the end of the PR. Don't touch `.claude/agents/logger.md`.
