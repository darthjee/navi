# Plan: Reduce Codacy duplication in emit and extraction job specs

Issue: [873-reduce-codacy-duplication-in-emit-and-extraction-job-specs.md](../../issues/873-reduce-codacy-duplication-in-emit-and-extraction-job-specs.md)

## Overview
Everything lives under `source/spec/` (owned by `engine`); no production code changes. The duplication comes from three sources:

- Inline job construction — `new ExtractionJob({ id: 'test-id', rawBody, parser, parserRegistry, ... })` and `new HtmlParseJob({ id: 'test-id', rawHtml, assetRequests, jobRegistry, clientRegistry })` are repeated in nearly every test, because neither job has a factory (`EmitJobFactory` already exists).
- Repeated call/expectation blocks — `await job.perform(logContext).catch(() => {})`, `parserImpl.extract.and.returnValue(...)` + `perform`, `jobRegistry.enqueue` `toHaveBeenCalledWith('Emit'|'AssetDownload', ...)`, repeated `EmissionRegistry.getRecords()` assertions, and hand-rolled `emit = ...; job = EmitJobFactory.build({...})` blocks that `rebuildJob` in `EmitJob_spec.js` already almost covers.
- Copied end-to-end scenario setup in `ExtractionEmitFlow_spec.js` — several `describe`s build the same `ResourceRequest` + `ResourceRequestJob` + `AxiosUtils.stubGet/stubPost` skeleton and repeat the "perform → find enqueued ExtractionJob → perform → find EmitJobs → perform each" walk.

Approach, following the precedent of #871 / #872: job construction goes into factories under `source/spec/support/factories/` (new `ExtractionJobFactory`, `HtmlParseJobFactory`; extend `EmitJob_spec.js`'s local `rebuildJob` / `EmitJobFactory` usage); scenario, fixture and expectation helpers go in `source/spec/support/utils/` (like `JobRegistryScenarios.js`, `CssSelectorHtmlFixtures.js`); scenarios differing only by input/expectation are parameterised with `[...].forEach(...)`. Every existing scenario and assertion is kept, and readability wins over maximal de-duplication.

## Steps

- [01 — Add ExtractionJob and HtmlParseJob factories](engine/01-add-job-factories.md)
- [02 — Refactor EmitJob_spec.js](engine/02-refactor-emit-job-spec.md)
- [03 — Refactor ExtractionJob_spec.js](engine/03-refactor-extraction-job-spec.md)
- [04 — Refactor HtmlParseJob_spec.js](engine/04-refactor-html-parse-job-spec.md)
- [05 — Refactor ExtractionEmitFlow_spec.js](engine/05-refactor-extraction-emit-flow-spec.md)

## CI Checks
- `source`: `docker compose run --rm navi_tests bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `Unit tests (Jasmine)` = `npm run coverage`, `Lint and report` = `scripts/ci.sh lint-and-report source`). `yarn report` runs `jscpd lib spec`, which is the local proxy for the Codacy duplication figure — compare the four specs' clone counts before/after.

## Notes
- Line counts/clone numbers in the issue are a baseline from `f25bf98`; the files have since grown (`EmitJob_spec.js` 580 lines, `ExtractionEmitFlow_spec.js` 500, `ExtractionJob_spec.js` 330, `HtmlParseJob_spec.js` 211). The final Codacy comparison is done manually by the issue owner.
- Suggested order is 01 → 02..05 (02 and 05 do not depend on 01; 03 and 04 do). Each step should leave the suite green so the steps can be committed separately.
- Do not reduce test count or weaken any assertion. Run the full spec suite before/after and confirm the number of specs is unchanged (parameterised tables must expand to the same cases).
- Every new factory/util needs JSDoc (the `check_docs` pedantic build covers `lib`, but keep support files consistent with `EmitJobFactory` / `AssetRequestFactory` style).
- Note on ids: the existing specs use `id: 'test-id'` for `ExtractionJob`/`HtmlParseJob`; no assertion depends on it, but keep `'test-id'` as the new factories' default id to avoid churn (EmitJobFactory uses `'id'` because `EmitJob_spec` asserts on it).
