# Issue: Unsafe dynamic import() in loadExtensions.js (XSS risk)

## Description
Codacy's ESLint `no-unsanitized/method` rule flags an unsanitized dynamic `import()` call as the only `Error`-severity (highest) finding in the repo's Codacy scan.

**Location:** `frontend/src/extensions/loadExtensions.js:52`

```js
mod = await import(/* @vite-ignore */ bundle.src);
```

`bundle.src` is not a string literal, so the rule assumes it could be influenced by untrusted input, which would make this an arbitrary-module-load / XSS vector.

## Problem
Investigation of where `bundle.src` actually comes from:

- `loadExtensions.js` builds its bundle list from `GET /extensions/frontend.json`, served by `source/lib/server/handlers/FrontendManifestHandler.js`.
- That handler never reads request input. It builds each entry as `{ src: '/extensions/frontend/' + name }` from a lexicographic `fs.readdirSync()` listing of `ExtensionsEnv.frontendDir` (`<NAVI_EXTENSIONS_DIR>/frontend/`, default `/navi/extensions/frontend` — see `source/lib/server/extensions/ExtensionsEnv.js`).
- That directory is a filesystem path mounted by whoever deploys/operates Navi. Nothing in this repo exposes an HTTP endpoint (upload, config API, etc.) that lets a client write into it.

So today, `bundle.src` cannot be influenced by request input through any surface this app exposes — only by someone with filesystem/deploy access to the mounted extensions volume, who is already a trusted operator. The Codacy rule still flags the line because it only looks at whether the argument is a literal, not where the value actually originates.

## Expected Behavior
The Codacy `Error`-severity finding is resolved (either suppressed with a documented justification, or made moot by validation), and the invariant that `bundle.src` is always a trusted, server-derived path is recorded so it doesn't need re-investigating next time this finding resurfaces.

## Solution
In `frontend/src/extensions/loadExtensions.js`, immediately above the `import()` call:

1. Add a comment documenting the invariant: `bundle.src` is always built server-side by `FrontendManifestHandler` from a directory listing of the deployer-mounted `<NAVI_EXTENSIONS_DIR>/frontend/` folder (see `source/lib/server/handlers/FrontendManifestHandler.js` and `source/lib/server/extensions/ExtensionsEnv.js`) — never from request/query/body input — so it is not attacker-controllable through any HTTP surface this app exposes.
2. Add `// eslint-disable-next-line no-unsanitized/method` right above the `import()` line, since ESLint disable comments are honored by Codacy's own ESLint-based scan even though the repo's local `eslint.config.mjs` doesn't register that plugin/rule itself (it's a no-op locally, but suppresses the finding in Codacy).

No behavior change; this only documents the already-safe invariant and clears the flagged finding.

## Benefits
- Clears the only `Error`-severity finding in the repo's Codacy scan.
- Leaves a documented, verified invariant about `bundle.src`'s provenance for future readers/auditors instead of a silent suppression.
