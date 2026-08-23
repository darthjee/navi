# Issue: Crawler: wire ExtractionJob output into EmitJob and verify the worked examples end-to-end

## Description

Part of #671 (the crawler epic, closed pending this and #678). The config (#673), `ExtractionJob`+parsers (#674, #675), and `EmitJob` (#676) sub-issues have already landed each piece in isolation and are merged, so this issue is correctly unblocked. This sub-issue owns connecting them — enqueuing one `EmitJob` per item produced by `ExtractionJob` — and proving the two worked examples in `docs/agents/future/crawler/flows.md` (the Loot Studios `json_path`+filter+chaining example, and the regex-standalone example) actually work end-to-end.

Note: sibling issue #678 (register `ExtractionJob`/`EmitJob` in the frontend's `jobClasses.js`) is still open and only half-done — `ExtractionJob` is registered there but `EmitJob` is not. This issue will make `EmitJob` actually run in dev/production, which will surface that gap in the monitoring UI — but fixing it stays #678's responsibility, out of scope here.

## Problem

Confirmed in the current code:

- `ExtractionJob` (`source/lib/jobs/ExtractionJob.js`) resolves the parser and extracts items, but `perform()` only logs the resulting items via `logContext.debug` — it never enqueues anything. Its constructor doesn't even receive a `jobRegistry`, `clients`, `emit`, or `parameters`.
- `EmitJob` (`source/lib/jobs/EmitJob.js`) works correctly in isolation, but nothing in the codebase ever calls `jobRegistry.enqueue('Emit', ...)` — it's only reachable directly today.
- `ResourceRequest` (`source/lib/models/request/ResourceRequest.js`) already parses a resource's `emit` config into a `ResourceRequestEmit` instance, but has no `hasEmit()`/`enqueueEmit()` methods, and its existing `enqueueExtraction()` only forwards `{ rawBody, parser }` to the `Extraction` job — the parsed `emit` config and `parameters` are dropped.
- `JobFactory.build('Extraction', ...)` (registered in `ApplicationInstance.js`) is only given `{ parserRegistry }`, unlike `HtmlParseJob`'s registration which is also given `jobRegistry`/`clientRegistry` specifically so it can enqueue follow-up jobs.

Net effect: a resource declaring `parser`+`emit` today extracts items (log-only) but never emits them — the two pieces exist but are not connected.

## Expected Behavior

- [ ] One `EmitJob` is enqueued per item extracted by `ExtractionJob`, for both built-in parsers (`json_path`, `regex`)
- [ ] A resource with only `actions` behaves exactly as before (regression check)
- [ ] A resource with only `parser`+`emit` extracts and emits without chaining
- [ ] A resource with both `actions` and `parser`+`emit` does both, without interference (this already holds structurally today — `ActionProcessingJob` and `ExtractionJob` are independent branches off `ResourceRequestJob`)
- [ ] The Loot Studios worked example (`json_path` + filter + chaining) from `flows.md` passes as an automated test
- [ ] The regex-standalone worked example from `flows.md` passes as an automated test
- [ ] `docs/agents/flow/actions-and-assets.md` documents the new extraction→emit pipeline branch

## Solution

- Define/document the shared "extracted item" contract: both built-in parsers (`JsonPathParser`, `RegexParser`) already return `Array<{[field]: value}>` (a flat plain object per item) — this task is about formalizing that de-facto shape as the contract `EmitJob` consumes, not inventing a new one.
- Follow the codebase's existing fan-out convention (`ActionsEnqueuer`/`ActionEnqueuer` for actions, `AssetRequestEnqueuer` for assets — every existing job that enqueues N follow-up jobs delegates to a dedicated Enqueuer class rather than calling `jobRegistry.enqueue(...)` inline): add a new `EmitEnqueuer` taking `(items, emit, parameters, jobRegistry, clients)`, whose `enqueue()` loops over items and calls `jobRegistry.enqueue('Emit', {...})` per item, independently unit-tested like `ActionEnqueuer_spec.js`/`AssetRequestEnqueuer_spec.js`.
- Extend `ExtractionJob` to receive what it needs to construct that call (`jobRegistry`, `clients`, the resource's `emit` config, `parameters`); `perform()` extracts items then delegates to `new EmitEnqueuer(items, this.#emit, ...).enqueue()`, mirroring how `HtmlParseJob.perform()` delegates to `AssetRequestEnqueuer`.
- The `parameters` made available for `EmitJob`/`ResourceRequestEmit.resolveUrl()`'s URL placeholders are the original resource-request parameters that triggered the parent `ResourceRequestJob` (consistent with how actions/pagination already resolve parameters) — not the extracted item's own fields.
- Add `hasEmit()`/an `enqueueEmit`-equivalent path on `ResourceRequest`, and thread `emit`/`parameters` through `enqueueExtraction()` and the `JobFactory.build('Extraction', ...)` registration in `ApplicationInstance.js`.
- Add an integration-level spec (or dev-app-backed test, following existing patterns in `source/spec/`) reproducing the Loot Studios example and the regex-standalone example from `flows.md`, end-to-end.
- Update the Runtime Flow docs: extend `docs/agents/flow/actions-and-assets.md` with a new subsection documenting the extraction→emit branch, alongside its existing Actions/Paginated Actions/Asset Processing sections.
- Out of scope: registering `EmitJob` in the frontend's `jobClasses.js` stays owned by sibling issue #678, not folded into this one.
