# Engine Plan: Reduce Codacy duplication in ResourceEnqueuer spec

Main plan: [plan.md](plan.md)

## Overview
`ResourceEnqueuer_spec.js` (296 lines) hand-builds `ResourceRequest` → `Resource` → `Namespace` → `NamespaceMap` fixtures in almost every scenario, repeats the same enqueue + `not.toHaveBeenCalled` + `toEqual` skeleton across the "skips …" scenarios, and repeats the `toHaveBeenCalledWith('ResourceRequestJob', …)` expectation. #869 already added `source/spec/support/utils/NamespaceMapUtils.js` (`NamespaceMapUtils.build({ default: { name: url }, ns: {...} })`, returning the built requests keyed by resource name), currently used only by `ApiEngineStartHandler_spec.js`.

## Implementation Steps

### Step 1 — Let `NamespaceMapUtils` describe disabled resources
In `source/spec/support/utils/NamespaceMapUtils.js`, allow a resource value to be either a url string (unchanged behaviour) or an object `{ url, disabled }`, passing `disabled` through to `ResourceRequestFactory.build({ url, disabled })`. Update the JSDoc/`@example`. Existing callers (`ApiEngineStartHandler_spec.js`) must keep working without modification. Keep the helper small: only `disabled` is needed by this spec, do not add speculative options.

### Step 2 — Refactor `ResourceEnqueuer_spec.js`
- Replace hand-built fixtures with `NamespaceMapUtils.build(...)`, taking requests from its return value (e.g. `const { home_page: homePageRequest } = NamespaceMapUtils.build({ default: { home_page: '/' } })`). Keep `afterEach(() => NamespaceMap.reset())` in the spec (the helper leaves cleanup to the caller). Drop the now-unused `Namespace`, `ResourceFactory`, `ResourceRequestFactory` imports.
- Scenarios needing an empty namespace or a resource without requests (`new Namespace({ name: 'default' })`, `missing_namespace`) use `NamespaceMapUtils.build()` / `NamespaceMapUtils.build({ reports: {} })`.
- Collapse the near-identical "skips …" scenarios (unknown name → `not_found`, needs params → `needs_params`, disabled → `disabled`, disabled + needs params → `disabled`, and the "target namespace missing" / "no fallback to default" variants where they fit) into a table-driven loop of `[title, fixture, names, expectedSkipped]` cases, preserving each existing scenario title and the `expect(JobRegistry.enqueue).not.toHaveBeenCalled()` + `toEqual({ enqueued: [], skippedResources: [...] })` assertions.
- Add a small local helper (e.g. `expectEnqueued(request, parameters)`) for the repeated `toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest, parameters })`, only if it lowers duplication without hurting readability; scenarios with two calls (`repeats with different parameters`) keep an explicit `toHaveBeenCalledTimes(2)`.
- Inside `describe('with per-entry and target-level parameters')`, build the `categories` fixture once in `beforeEach` via `NamespaceMapUtils`; the "still skips as disabled even when parameters are supplied" scenario rebuilds the map with a disabled resource (keeping the `NamespaceMap.reset()` before it).
- Every existing scenario and assertion must remain (same number of covered behaviours); do not change production code.

## Files to Change
- `source/spec/support/utils/NamespaceMapUtils.js` — accept `{ url, disabled }` resource descriptors, backwards-compatible with url strings.
- `source/spec/lib/utils/ResourceEnqueuer_spec.js` — use `NamespaceMapUtils`, parameterise the skip scenarios, share the enqueue expectation.

## CI Checks
- `source`: `cd source && npm run coverage` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` (CI job: `checks`)
- Codacy duplication for `ResourceEnqueuer_spec.js` should drop after push (cannot be verified locally).

## Notes
- The issue's clarifying questions (extend `NamespaceMapUtils`, parameterise skip cases, share the enqueue expectation) were not answered explicitly; this plan follows the recommendations recorded in the issue's Solution section.
- Line references in the original issue are stale (file grew from 236 to 296 lines); rely on scenario titles instead.
- Prefer readability over maximal de-duplication: if a table-driven case makes a failure harder to attribute, keep that scenario as a separate `it`.
