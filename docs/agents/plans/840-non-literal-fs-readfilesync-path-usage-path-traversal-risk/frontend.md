# frontend Plan: Non-literal fs.readFileSync path usage (path-traversal risk)

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent's change is self-contained (see `plan.md`).

## Implementation Steps

### Step 1 — Add scoped eslint-disable + rationale in frontend/spec

`frontend/spec/index_html_importmap_spec.js:4` is flagged: the path is built from a hardcoded relative literal (`'../index.html'`) combined with `import.meta.url` — there is no variable input at all, so this is effectively a false positive introduced only by the `new URL(...)`/`fileURLToPath` wrapping.

Add a short rationale comment (1-2 lines) directly above the flagged line explaining why the path is safe, followed by `// eslint-disable-next-line security/detect-non-literal-fs-filename` on its own line immediately before the call — matching the style at `frontend/src/extensions/loadExtensions.js:56-58` and `source/lib/server/extensions/ExtensionRoutesLoader.js:75`. Do not disable the rule at the file or project level.

## Files to Change

- `frontend/spec/index_html_importmap_spec.js` — add rationale comment + `eslint-disable-next-line security/detect-non-literal-fs-filename` above the `readFileSync(...)` call (line 4-7).

## CI Checks

- `frontend`: `npm run lint` (CI job: `checks-frontend`)

## Notes

- No behavior change — this only silences a specific, already-reviewed lint finding with a documented reason.
