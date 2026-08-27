# Engine Plan: Fix broken import

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Move `AppError` into `source/lib/common/exceptions/` and repoint its subclasses

Relocate `source/lib/exceptions/AppError.js` to `source/lib/common/exceptions/AppError.js` (file content unchanged). `AppError` is the single shared base class checked polymorphically in `source/lib/server/handlers/api/ApiConfigHandler.js` (`error instanceof AppError`), so every one of its existing subclasses must keep extending this same class from its new location — only their import path changes, the classes themselves stay where they are.

Update the `import { AppError } from ...` line in each of the following, replacing the old relative path with one that resolves to `source/lib/common/exceptions/AppError.js`:

- `../AppError.js` → `../../common/exceptions/AppError.js` in all of:
  - `source/lib/exceptions/config/ConfigurationFileNotFound.js`
  - `source/lib/exceptions/config/ConfigurationFileNotProvided.js`
  - `source/lib/exceptions/config/InvalidEmitMethod.js`
  - `source/lib/exceptions/config/InvalidMemoryThresholds.js`
  - `source/lib/exceptions/config/InvalidParserMatch.js`
  - `source/lib/exceptions/config/InvalidParserType.js`
  - `source/lib/exceptions/config/MissingEmitUrl.js`
  - `source/lib/exceptions/config/MissingParserField.js`
  - `source/lib/exceptions/config/MissingParserFields.js`
  - `source/lib/exceptions/config/MissingParserMatch.js`
  - `source/lib/exceptions/config/MissingTopLevelConfgKey.js`
  - `source/lib/exceptions/http/ConflictError.js`
  - `source/lib/exceptions/http/ForbiddenError.js`
  - `source/lib/exceptions/http/NotFoundError.js`
  - `source/lib/exceptions/registry/ItemNotFound.js`
  - `source/lib/exceptions/registry/MissingActionResource.js`
  - `source/lib/exceptions/registry/MissingMappingVariable.js`
  - `source/lib/exceptions/request/InvalidResponseBody.js`
  - `source/lib/exceptions/request/NullResponse.js`
  - `source/lib/exceptions/request/RequestFailed.js`
- `../../../exceptions/AppError.js` → `../../../common/exceptions/AppError.js` in `source/lib/server/handlers/api/ApiConfigHandler.js`
- `../../../../lib/exceptions/AppError.js` → `../../../../lib/common/exceptions/AppError.js` in `source/spec/lib/exceptions/config/InvalidMemoryThresholds_spec.js`

### Step 2 — Move `InvalidHtmlResponseBody` into `source/lib/common/exceptions/request/` and repoint its importers

Relocate `source/lib/exceptions/request/InvalidHtmlResponseBody.js` to `source/lib/common/exceptions/request/InvalidHtmlResponseBody.js` (update its own `import { AppError }` line to `'../AppError.js'`, now a sibling one level up). Relocate its spec `source/spec/lib/exceptions/request/InvalidHtmlResponseBody_spec.js` to `source/spec/lib/common/exceptions/request/InvalidHtmlResponseBody_spec.js`, mirroring the new source path, and update both its imports (`AppError` and `InvalidHtmlResponseBody`) to `'../../../../../lib/common/exceptions/AppError.js'` and `'../../../../../lib/common/exceptions/request/InvalidHtmlResponseBody.js'` respectively.

Update the `import { InvalidHtmlResponseBody } from ...` line in each of the following:

- `source/lib/common/utils/parser/HtmlRootParser.js`: `'../../../exceptions/request/InvalidHtmlResponseBody.js'` → `'../../exceptions/request/InvalidHtmlResponseBody.js'`
- `source/spec/lib/common/utils/parser/HtmlRootParser_spec.js`: `'../../../../../lib/exceptions/request/InvalidHtmlResponseBody.js'` → `'../../../../../lib/common/exceptions/request/InvalidHtmlResponseBody.js'`
- `source/spec/lib/parsers/CssSelectorParser_spec.js`: `'../../../lib/exceptions/request/InvalidHtmlResponseBody.js'` → `'../../../lib/common/exceptions/request/InvalidHtmlResponseBody.js'`
- `source/spec/lib/utils/HtmlParser_spec.js`: `'../../../lib/exceptions/request/InvalidHtmlResponseBody.js'` → `'../../../lib/common/exceptions/request/InvalidHtmlResponseBody.js'`

This is the file the broken import in the issue actually points at, so this step is what fixes the reported crash: once it lives under `lib/common`, it's included by both the `navi_dev_app` docker-compose mounts (`./source/lib/common:/home/node/app/lib/common`, `./source/spec/lib/common:/home/node/app/spec/lib/common`) and the CI `scripts/ci/setup-dev.sh` copy step (`cp -r source/lib/common dev/app/lib/common`, `cp -r source/spec/lib/common dev/app/spec/lib/common`) — neither of which needs any changes of its own.

## Files to Change

**Moved:**
- `source/lib/exceptions/AppError.js` → `source/lib/common/exceptions/AppError.js`
- `source/lib/exceptions/request/InvalidHtmlResponseBody.js` → `source/lib/common/exceptions/request/InvalidHtmlResponseBody.js`
- `source/spec/lib/exceptions/request/InvalidHtmlResponseBody_spec.js` → `source/spec/lib/common/exceptions/request/InvalidHtmlResponseBody_spec.js`

**Import path updated only (not moved):** the 20 files listed under Step 1 (19 exception subclasses + `ApiConfigHandler.js`), `InvalidMemoryThresholds_spec.js`, and the 4 files listed under Step 2 (`HtmlRootParser.js`, `HtmlRootParser_spec.js`, `CssSelectorParser_spec.js`, `HtmlParser_spec.js`).

## CI Checks

- `source`: `npm run coverage` and `npm run lint` (CI jobs: `jasmine`, `checks`) — verifies the moved/repointed files still pass in the engine's own suite.
- `dev/app`: `scripts/ci.sh setup-dev && cd dev/app && npm run coverage` and `... && npm run lint` (CI jobs: `jasmine-dev`, `checks-dev`) — this is the job that currently fails with the reported `ERR_MODULE_NOT_FOUND` and must pass after this change; locally, the docker-compose equivalent is running the test/lint command inside the `navi_dev_app` container.

## Notes

- `source/lib/exceptions/{config,http,registry}/` and the rest of `request/` are **not** moved — only `AppError.js` and `InvalidHtmlResponseBody.js` relocate into `common`, since those are the only two classes code under `lib/common` actually depends on today.
- No `docker-compose.yml` or `scripts/ci/setup-dev.sh` changes are needed — both already mirror the entire `lib/common`/`spec/lib/common` trees, so the moved files are picked up automatically.
