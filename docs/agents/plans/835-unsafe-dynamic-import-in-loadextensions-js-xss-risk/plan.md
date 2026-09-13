# Plan: Unsafe dynamic import() in loadExtensions.js (XSS risk)

Issue: [835-unsafe-dynamic-import-in-loadextensions-js-xss-risk.md](../issues/835-unsafe-dynamic-import-in-loadextensions-js-xss-risk.md)

## Overview
Document the already-verified invariant that `bundle.src` passed into the dynamic `import()` in `frontend/src/extensions/loadExtensions.js` is always server-derived and never influenced by request input, and suppress Codacy's `no-unsanitized/method` finding for that line accordingly.

See [frontend.md](frontend.md) for the full plan.
