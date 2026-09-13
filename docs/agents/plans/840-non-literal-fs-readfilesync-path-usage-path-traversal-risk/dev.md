# dev Plan: Non-literal fs.readFileSync path usage (path-traversal risk)

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent's change is self-contained (see `plan.md`).

## Implementation Steps

### Step 1 — Add scoped eslint-disable + rationale in dev/app

Two call sites in `dev/app` are flagged:

- `dev/app/server.js:10` — `dataPath` comes from `process.argv[2]` (default `'./data.yml'`), a CLI argument supplied only by whoever launches the dev server process at startup. It is never derived from an HTTP request handled by the app (same trust level as `configPath` already passed to `AppConfig.load` on the line above), so no request-derived input reaches this path.
- `dev/app/spec/support/utils/FixturesUtils.js:12` — the `file` argument reaching `readFileSync` (via `getFixturePath`) is always a literal fixture filename supplied by the calling spec code itself; this is a test-only helper, never reachable from external input.

For each, add a short rationale comment (1-2 lines) directly above the flagged line explaining why the path is safe there, followed by `// eslint-disable-next-line security/detect-non-literal-fs-filename` on its own line immediately before the call — matching the style at `frontend/src/extensions/loadExtensions.js:56-58` and `source/lib/server/extensions/ExtensionRoutesLoader.js:75`. Do not disable the rule at the file or project level.

## Files to Change

- `dev/app/server.js` — add rationale comment + `eslint-disable-next-line security/detect-non-literal-fs-filename` above the `readFileSync(dataPath, 'utf8')` call (line 10).
- `dev/app/spec/support/utils/FixturesUtils.js` — add rationale comment + `eslint-disable-next-line security/detect-non-literal-fs-filename` above the `readFileSync(filePath, 'utf8')` call in `loadFixture` (line 12).

## CI Checks

- `dev/app`: `npm run lint` (CI job: `checks-dev`)

## Notes

- No behavior change — this only silences a specific, already-reviewed lint finding per line with a documented reason.
