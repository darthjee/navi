# Plan: Fetch CSS from HTML Responses

## Overview

Extend Navi's resource pipeline to support HTML responses. When a `ResourceRequest` declares an `assets` key, the worker enqueues an `HtmlParseJob` instead of (or alongside) the existing JSON/actions path. `HtmlParseJob` uses a new `HtmlParser` to extract asset URLs via CSS selectors, then enqueues one `AssetDownloadJob` per discovered URL. This mirrors the existing `ActionProcessingJob` / `ResourceRequestJob` async pattern.

## Context

Currently `ResponseParser` only handles JSON. HTML responses trigger `InvalidResponseBody`. The new pipeline adds two new job types and a new model, keeping the design queue-driven and asynchronous — consistent with the existing `actions` mechanism.

## Sub-plans

- [New Classes](plan_new_classes.md) — exception, model, parser, two new job types, URL resolution
- [Integration](plan_integration.md) — changes to existing classes and factory registration
- [Tests](plan_tests.md) — test scenarios for all new and modified classes
- [Documentation](plan_docs.md) — updates to internal docs and public-facing READMEs

## Files to Change

### New files
- `source/lib/exceptions/InvalidHtmlResponseBody.js`
- `source/lib/models/AssetRequest.js`
- `source/lib/utils/HtmlParser.js`
- `source/lib/models/HtmlParseJob.js`
- `source/lib/models/AssetDownloadJob.js`
- `source/spec/lib/exceptions/InvalidHtmlResponseBody_spec.js`
- `source/spec/lib/models/AssetRequest_spec.js`
- `source/spec/lib/utils/HtmlParser_spec.js`
- `source/spec/lib/models/HtmlParseJob_spec.js`
- `source/spec/lib/models/AssetDownloadJob_spec.js`

### Modified files
- `source/lib/models/ResourceRequest.js`
- `source/lib/models/ResourceRequestJob.js`
- `source/lib/services/Application.js`
- `source/spec/lib/models/ResourceRequest_spec.js`
- `source/spec/lib/models/ResourceRequestJob_spec.js`
- `source/spec/lib/services/Application_spec.js`
- `docs/agents/flow.md`
- `docs/agents/overview.md`
- `docs/agents/architecture.md`
- `README.md`
- `source/README.md`
- `DOCKERHUB_DESCRIPTION.md`

## Notes

- The DOM parsing library (`node-html-parser` or `cheerio`) must be added as a dependency via `yarn`.
- `HtmlParseJob` has no retry rights, consistent with `ActionProcessingJob`. `AssetDownloadJob` follows the standard retry path, consistent with `ResourceRequestJob`.
- URL resolution for root-relative paths requires access to the client's `base_url` inside `HtmlParseJob` — the `clientRegistry` or the resolved base URL must be passed in or injected.
- Open question: should `AssetDownloadJob` support retry (like `ResourceRequestJob`) or be exhausted after one failure (like `ActionProcessingJob`)? The issue implies standard retry behaviour.
