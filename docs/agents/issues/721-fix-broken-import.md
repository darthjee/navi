# Issue: Fix broken import

## Description
Running the dev-app test suite (`navi_dev_app` container: `npx c8 --reporter=lcov jasmine --config=spec/support/jasmine.json`) fails immediately with:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/root/project/dev/app/lib/exceptions/request/InvalidHtmlResponseBody.js' imported from /root/project/dev/app/spec/lib/common/utils/parser/HtmlRootParser_spec.js
```

## Problem
`docker-compose.yml` mounts `./source/lib/common` and `./source/spec/lib/common` into the `navi_dev_app` container so the dev app can reuse and test the shared common code. `source/lib/common/utils/parser/HtmlRootParser.js` imports `InvalidHtmlResponseBody` from `source/lib/exceptions/request/InvalidHtmlResponseBody.js`, which lives outside `lib/common` and is therefore never mounted into `dev/app`. Because `dev/app`'s jasmine config globs all `**/*[sS]pec.js` files under its (partially source-mounted) `spec` dir, the mounted `HtmlRootParser_spec.js` runs there too, and its import of the same missing exception fails, crashing the whole dev-app test run.

## Expected Behavior
`npx c8 ... jasmine ...` inside the `navi_dev_app` container should run to completion (all specs, including the mounted common ones, either pass or fail on their own assertions — not on a missing module).

## Solution
Move `InvalidHtmlResponseBody` into the `common` boundary instead of extending the docker-compose mounts. Concretely:

- Relocate `source/lib/exceptions/AppError.js` and `source/lib/exceptions/request/InvalidHtmlResponseBody.js` into `source/lib/common/exceptions/` (mirroring `AppError.js` at the root and `InvalidHtmlResponseBody.js` under a `request/` subfolder), along with their specs, so both land inside the already-mounted `lib/common`/`spec/lib/common` tree.
- `AppError` is the single shared base class polymorphically checked elsewhere (e.g. `error instanceof AppError` in `source/lib/server/handlers/api/ApiConfigHandler.js`), so it must stay one class used by every exception — the other ~20 exception classes under `source/lib/exceptions/{config,http,registry,request}/` are **not** moved; only their `import { AppError } from ...` path is updated to point at the new `common/exceptions/AppError.js` location.
- Update the other direct importers of `InvalidHtmlResponseBody` (`source/spec/lib/parsers/CssSelectorParser_spec.js`, `source/spec/lib/utils/HtmlParser_spec.js`) to the new path, and update `HtmlRootParser.js`'s own import accordingly.
- No `docker-compose.yml` changes are needed under this approach — the fix stays entirely inside `source/`. Owning agent: `engine` (`source/` is in its documented scope).

## Benefits
Restores the dev-app test suite to a runnable state, and keeps `common` genuinely self-contained (everything it depends on lives inside it), so future common code can keep depending on the shared exception hierarchy without ever needing another docker-compose mount.
