# Plan: Non-literal fs.readFileSync path usage (path-traversal risk)

Issue: [840-non-literal-fs-readfilesync-path-usage-path-traversal-risk.md](../../issues/840-non-literal-fs-readfilesync-path-usage-path-traversal-risk.md)

## Overview

Codacy's `security/detect-non-literal-fs-filename` ESLint rule flags 4 call sites where `fs.readFileSync` receives a non-literal path. Each site has been reviewed and confirmed safe (CLI-supplied config path, or hardcoded/test-only fixture paths). The fix is purely additive: a scoped `eslint-disable-next-line` plus a short rationale comment at each site, following the convention already used in this repo (see `frontend/src/extensions/loadExtensions.js:56-58` and `source/lib/server/extensions/ExtensionRoutesLoader.js:75`). No behavior changes, no broader rule suppression.

## Agents involved

- [dev](dev.md)
- [engine](engine.md)
- [frontend](frontend.md)

## Shared contracts

None. Each agent's change is an independent, single-line eslint-disable + rationale comment in its own files; no interface, data shape, or dependency crosses between them. The only thing shared is the *convention* to follow (rationale comment directly above `// eslint-disable-next-line security/detect-non-literal-fs-filename`), which is spelled out identically in each agent's file below.
