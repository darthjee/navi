# engine Plan: Non-literal fs.readFileSync path usage (path-traversal risk)

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent's change is self-contained (see `plan.md`).

## Implementation Steps

### Step 1 — Add scoped eslint-disable + rationale in source/spec

`source/spec/support/utils/FixturesUtils.js:12` is flagged: the `file` argument reaching `readFileSync` (via `getFixturePath`) is always a literal fixture filename supplied by the calling spec code itself; this is a test-only helper, never reachable from external input.

Add a short rationale comment (1-2 lines) directly above the flagged line explaining why the path is safe, followed by `// eslint-disable-next-line security/detect-non-literal-fs-filename` on its own line immediately before the call — matching the style at `frontend/src/extensions/loadExtensions.js:56-58` and `source/lib/server/extensions/ExtensionRoutesLoader.js:75`. Do not disable the rule at the file or project level.

## Files to Change

- `source/spec/support/utils/FixturesUtils.js` — add rationale comment + `eslint-disable-next-line security/detect-non-literal-fs-filename` above the `readFileSync(filePath, 'utf8')` call in `loadFixture` (line 12).

## CI Checks

- `source`: `npm run lint` (CI job: `checks`)

## Notes

- No behavior change — this only silences a specific, already-reviewed lint finding with a documented reason.
