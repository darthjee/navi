# Issue: Non-literal fs.readFileSync path usage (path-traversal risk)

## Description
Codacy's ESLint `security/detect-non-literal-fs-filename` rule (pattern `ESLint8_security_detect-non-literal-fs-filename`) flags 4 call sites where `fs.readFileSync` (or `node:fs`'s) is invoked with a non-literal path expression — a potential path-traversal vector if any of those paths were ever influenced by external input:

- `dev/app/server.js:10`
- `dev/app/spec/support/utils/FixturesUtils.js:12`
- `source/spec/support/utils/FixturesUtils.js:12`
- `frontend/spec/index_html_importmap_spec.js:4`

## Problem
Investigation of each site confirms none is currently exploitable, but each still needs a scoped, documented suppression so the rule keeps protecting the rest of the codebase and the finding doesn't linger as noise:

- **`dev/app/server.js:10`** — `dataPath` comes from `process.argv[2]` (default `'./data.yml'`), a CLI argument supplied by whoever launches the dev server process at startup. It is never derived from an HTTP request handled by the app, so no request-derived input reaches this path. This is the one non-test call site among the four.
- **`dev/app/spec/support/utils/FixturesUtils.js:12`** and **`source/spec/support/utils/FixturesUtils.js:12`** — the `file` argument reaching `readFileSync` is always a literal fixture filename supplied by the calling spec code itself; these are test-only helpers, never reachable from external input.
- **`frontend/spec/index_html_importmap_spec.js:4`** — the path is built from a hardcoded relative literal (`'../index.html'`) combined with `import.meta.url`; there is no variable input at all, so this is effectively a false positive introduced only by the `new URL(...)`/`fileURLToPath` wrapping.

## Expected Behavior
Codacy no longer reports `ESLint8_security_detect-non-literal-fs-filename` for these 4 locations, ESLint passes cleanly, and the rule remains fully enabled (no global/file-level suppression) to catch any future non-literal `fs` path usage.

## Solution
For each of the 4 locations, add a scoped `// eslint-disable-next-line security/detect-non-literal-fs-filename` immediately above the flagged line, preceded by a short rationale comment explaining why the path is safe at that call site — following the rationale-comment + `eslint-disable-next-line` convention already established in this repo (see `frontend/src/extensions/loadExtensions.js:56-58` and `source/lib/server/extensions/ExtensionRoutesLoader.js:75`, from the #835 fix).

Do not disable the rule at a broader scope (file-level or project-wide) — each disable stays scoped to its single line so the rule keeps catching future regressions elsewhere.

This spans three specialist domains: `dev/app/server.js` and `dev/app/spec/...` (dev agent), `source/spec/...` (engine agent), and `frontend/spec/...` (frontend agent).

## Benefits
Closes out the static-analysis finding with a documented, per-line justification instead of a blanket suppression, preserving the rule's ability to catch genuinely risky non-literal filesystem access introduced later.
