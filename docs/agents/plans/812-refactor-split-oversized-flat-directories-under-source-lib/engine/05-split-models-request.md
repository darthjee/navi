# Split models/request

`source/lib/models/request/` has 12 flat `.js` files. Break into three sub-domain folders,
leaving the three standalone request value objects flat.

- `resource_request/` — `ResourceRequest.js`, `ResourceRequestAction.js`,
  `ResourceRequestEmit.js`, `ResourceRequestPaginatedAction.js`, `ResourceRequestParser.js`
- `renderers/` — `BodyTemplateRenderer.js`, `TemplateStringRenderer.js`
- `tokens/` — `TokenResolver.js`, `UrlTokenResolver.js`
- stay flat — `AssetRequest.js`, `ClientReference.js`, `Resource.js`

Largest resulting flat listing: 3 files + 3 folders (was 12).

## What to do

1. Create the three subfolders under `source/lib/models/request/`; move the nine files in.
2. Fix moved files' own relative imports — the `ResourceRequest*` group cross-imports heavily
   (stays same-folder) but also imports `exceptions/config/`, `registry/`, `parsers/`,
   `enqueuers/`, `models/response/` etc.: each of those gains one `../`. `renderers/` and
   `tokens/` files likewise. Note `ResourceRequest*` also import the renderers/token resolvers
   — those become `../renderers/...` / `../tokens/...`.
3. Repoint external importers (verify with
   `git grep -n "models/request/" source/lib source/spec`):
   - `source/lib/`: `services/config/ConfigParser.js` (the main non-spec consumer; also check
     `enqueuers/`, `jobs/`, `serializers/` for any `models/request` imports the grep surfaces)
   - `source/spec/`: `lib/jobs/ExtractionEmitFlow_spec.js`, `lib/jobs/ExtractionJob_spec.js`,
     `support/factories/AssetRequestFactory.js`, `support/factories/ResourceFactory.js`,
     `support/factories/ResourceRequestActionFactory.js`,
     `support/factories/ResourceRequestEmitFactory.js`,
     `support/factories/ResourceRequestFactory.js`
   - the specs that live in `source/spec/lib/models/request/` for the moved files (11 files)
     move with them — see step 4.
4. Mirror the spec tree: create `resource_request/`, `renderers/`, `tokens/` under
   `source/spec/lib/models/request/` and move the matching `*_spec.js` files
   (`ResourceRequest_spec.js`, `ResourceRequestAction_spec.js`, `ResourceRequestEmit_spec.js`,
   `ResourceRequestPaginatedAction_spec.js`, `ResourceRequestParser_spec.js` →
   `resource_request/`; `BodyTemplateRenderer_spec.js`, `TemplateStringRenderer_spec.js` →
   `renderers/`; `TokenResolver_spec.js`, `UrlTokenResolver_spec.js` → `tokens/`). Leave
   `AssetRequest_spec.js` and `Resource_spec.js` flat. Fix `../` depth (+1).
5. Update `docs/agents/architecture/source-layout.md` — `models/` section, the
   `models/request/` bullet.
6. Validate: `npm test`, `npm run lint`, `npm run check_docs` clean;
   `git grep -n "models/request/" source/lib source/spec` returns only updated paths.

Commit: `refactor(models): split models/request into resource_request/renderers/tokens`.

## Files to Change

- `source/lib/models/request/*.js` — 9 of 12 **moved** into `resource_request/`, `renderers/`,
  `tokens/`; own relative imports fixed
- `source/spec/lib/models/request/*_spec.js` — 9 matching specs **moved** into mirrored
  subfolders, relative imports fixed
- `source/lib/services/config/ConfigParser.js` (+ any other importer the grep surfaces)
- 7 `source/spec/` factory/spec files listed above
- `docs/agents/architecture/source-layout.md` — `models/request/` bullet restructured
