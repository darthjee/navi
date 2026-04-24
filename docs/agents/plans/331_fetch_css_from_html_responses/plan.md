# Plan: Fetch CSS from HTML Responses

## Overview

Extend Navi's resource pipeline to support HTML responses. When a `ResourceRequest` declares an `assets` key, the worker enqueues an `HtmlParseJob` instead of (or alongside) the existing JSON/actions path. `HtmlParseJob` uses a new `HtmlParser` to extract asset URLs via CSS selectors, then enqueues one `AssetDownloadJob` per discovered URL. This mirrors the existing `ActionProcessingJob` / `ResourceRequestJob` async pattern.

## Context

Currently `ResponseParser` only handles JSON. HTML responses trigger `InvalidResponseBody`. The new pipeline adds two new job types and a new model, keeping the design queue-driven and asynchronous — consistent with the existing `actions` mechanism.

## Implementation Steps

### Step 1 — Add `InvalidHtmlResponseBody` exception

Create `source/lib/exceptions/InvalidHtmlResponseBody.js` extending `AppError`.
Add it to the exception hierarchy documentation in `architecture.md`.

### Step 2 — Add `AssetRequest` model

Create `source/lib/models/AssetRequest.js` with:
- Fields: `selector` (string), `attribute` (string), `client` (optional string), `status` (optional number, default `200`).
- Static factory `AssetRequest.fromObject(obj)` and `AssetRequest.fromListObject(list)`.

### Step 3 — Add `HtmlParser` utility

Create `source/lib/utils/HtmlParser.js` (or `source/lib/services/HtmlParser.js`).
- `HtmlParser.parse(rawHtml, selector, attribute)` — uses a DOM library (`node-html-parser` or `cheerio`) to find all elements matching `selector` and returns an array of the `attribute` value from each.
- Throws `InvalidHtmlResponseBody` if the HTML cannot be parsed.
- Logs a warning (via `Logger`) when the selector matches zero elements or an element is missing the target attribute.

### Step 4 — Add `HtmlParseJob`

Create `source/lib/models/HtmlParseJob.js` extending `Job`.
- Constructor receives: `rawHtml` (string), `assetRequests` (array of `AssetRequest`), `jobRegistry`.
- `perform()`:
  1. For each `AssetRequest`, call `HtmlParser.parse(rawHtml, selector, attribute)`.
  2. Resolve each discovered URL (absolute / root-relative / protocol-relative — see URL resolution below).
  3. Enqueue one `AssetDownloadJob` per resolved URL via `JobRegistry.enqueue('AssetDownload', { url, client, status })`.
- No retry rights (analogous to `ActionProcessingJob`).

### Step 5 — Add `AssetDownloadJob`

Create `source/lib/models/AssetDownloadJob.js` extending `Job`.
- Constructor receives: `url` (fully-resolved string), `client` (optional string, defaults to `'default'`), `status` (number), `clientRegistry`.
- `perform()`: fetches the URL via the named `Client`, validates HTTP status. Follows the standard `RequestFailed` → retry / dead path on failure.
- Leaf node — no further chaining.

### Step 6 — URL resolution

Inside `HtmlParseJob.perform()` (or a small helper `AssetUrlResolver`), normalise discovered URLs:
- **Absolute** (`https://…`) — use as-is.
- **Protocol-relative** (`//…`) — prepend `https:`.
- **Root-relative** (`/…`) — concatenate with the `client`'s `base_url`.

### Step 7 — Update `ResourceRequest`

In `source/lib/models/ResourceRequest.js`:
- `fromObject()` — parse the optional `assets` list into `AssetRequest[]` via `AssetRequest.fromListObject()`.
- Add `enqueueAssets(rawHtml, jobRegistry)` method — enqueues one `HtmlParseJob` with the raw HTML and the asset requests list.

### Step 8 — Update `ResourceRequestJob`

In `source/lib/models/ResourceRequestJob.js`:
- After a successful HTTP response, if the `ResourceRequest` has `assets`:
  - Call `resourceRequest.enqueueAssets(rawBody, jobRegistry)` to enqueue `HtmlParseJob`.
  - Skip calling `ResponseParser` (response is HTML, not JSON).
- `actions` and `assets` are independent — a resource may have both.

### Step 9 — Update `ConfigParser`

In `source/lib/services/ConfigParser.js`:
- When building `ResourceRequest` instances, pass the raw object as-is; `ResourceRequest.fromObject()` already handles the `assets` key after Step 7.
- Register `HtmlParseJob` and `AssetDownloadJob` factories in `Application` (analogous to existing job factory registrations).

### Step 10 — Register job factories in `Application`

In `source/lib/services/Application.js`:
- `JobFactory.build('HtmlParse', ...)` — factory for `HtmlParseJob`.
- `JobFactory.build('AssetDownload', ...)` — factory for `AssetDownloadJob`.

### Step 11 — Tests

For each new class, create the corresponding spec under `source/spec/lib/`:

#### `exceptions/InvalidHtmlResponseBody_spec.js`
- Extends `AppError`.
- `error.name` equals `'InvalidHtmlResponseBody'`.

#### `models/AssetRequest_spec.js`
- `fromObject()` with all fields (`selector`, `attribute`, `client`, `status`) — returns correct instance.
- `fromObject()` with only required fields — `client` is undefined, `status` defaults to `200`.
- `fromListObject()` with a list — returns an array of `AssetRequest` instances.
- `fromListObject()` with an empty list — returns an empty array.

#### `utils/HtmlParser_spec.js`
- Returns the matching attribute values for a given selector.
- Returns values from multiple matching elements.
- Returns an empty array when no elements match the selector (and logs a warning).
- Skips elements that are missing the target attribute (and logs a warning for each).
- Throws `InvalidHtmlResponseBody` when the raw HTML cannot be parsed.

#### `models/HtmlParseJob_spec.js`
- `perform()` calls `HtmlParser` once per `AssetRequest`.
- Enqueues one `AssetDownloadJob` per discovered URL.
- Resolves absolute URLs (`https://…`) as-is.
- Resolves root-relative URLs (`/…`) by concatenating with the client's `base_url`.
- Resolves protocol-relative URLs (`//…`) by prepending `https:`.
- When a selector matches zero elements, no `AssetDownloadJob` is enqueued for that rule.
- With multiple `AssetRequest` rules, all discovered URLs across all rules are enqueued.
- No retry rights — the job is exhausted after the first failure.

#### `models/AssetDownloadJob_spec.js`
- `perform()` makes an HTTP request to the given URL using the named client.
- Falls back to the `default` client when no `client` is specified.
- Validates the expected HTTP status; does not throw when status matches.
- Throws `RequestFailed` when the status does not match, following the standard retry/dead path.
- Is a leaf node — does not enqueue further jobs after a successful fetch.

Update existing specs:

#### `models/ResourceRequest_spec.js`
- `fromObject()` with an `assets` list — parses into `AssetRequest[]`.
- `fromObject()` without an `assets` key — `assets` is empty / null.
- `enqueueAssets(rawHtml, jobRegistry)` enqueues one `HtmlParseJob`.

#### `models/ResourceRequestJob_spec.js`
- When the request has `assets`: enqueues `HtmlParseJob`; does **not** call `ResponseParser`.
- When the request has `actions` only: existing behaviour unchanged.
- When the request has both `assets` and `actions`: enqueues both `HtmlParseJob` and `ActionProcessingJob` independently.

#### `services/ConfigParser_spec.js`
- Config with an `assets` key on a resource request — produces `AssetRequest[]` on the resulting `ResourceRequest`.

#### `services/Application_spec.js`
- Registers `HtmlParse` and `AssetDownload` factories during `loadConfig`.

### Step 12 — Update documentation

- `docs/agents/flow.md` — document the new HTML asset-fetch flow.
- `docs/agents/overview.md` — mark asset-fetch as implemented.
- `docs/agents/architecture.md` — add `AssetRequest`, `HtmlParser`, `HtmlParseJob`, `AssetDownloadJob`, `InvalidHtmlResponseBody` to the relevant sections.

## Files to Change

- `source/lib/exceptions/InvalidHtmlResponseBody.js` — new
- `source/lib/models/AssetRequest.js` — new
- `source/lib/utils/HtmlParser.js` — new
- `source/lib/models/HtmlParseJob.js` — new
- `source/lib/models/AssetDownloadJob.js` — new
- `source/lib/models/ResourceRequest.js` — add `assets` parsing + `enqueueAssets()`
- `source/lib/models/ResourceRequestJob.js` — add HTML branch, skip `ResponseParser` when `assets` present
- `source/lib/services/ConfigParser.js` — ensure `assets` key flows through (likely no change needed if `ResourceRequest.fromObject` handles it)
- `source/lib/services/Application.js` — register `HtmlParse` and `AssetDownload` factories
- `source/spec/lib/exceptions/InvalidHtmlResponseBody_spec.js` — new
- `source/spec/lib/models/AssetRequest_spec.js` — new
- `source/spec/lib/utils/HtmlParser_spec.js` — new
- `source/spec/lib/models/HtmlParseJob_spec.js` — new
- `source/spec/lib/models/AssetDownloadJob_spec.js` — new
- `source/spec/lib/models/ResourceRequest_spec.js` — update
- `source/spec/lib/models/ResourceRequestJob_spec.js` — update
- `source/spec/lib/services/Application_spec.js` — update
- `docs/agents/flow.md` — update
- `docs/agents/overview.md` — update
- `docs/agents/architecture.md` — update

## Notes

- The DOM parsing library (`node-html-parser` or `cheerio`) needs to be added as a dependency via `yarn`.
- `HtmlParseJob` has no retry rights, consistent with `ActionProcessingJob`. `AssetDownloadJob` follows the standard retry path, consistent with `ResourceRequestJob`.
- URL resolution for root-relative paths requires access to the `client`'s `base_url` inside `HtmlParseJob` — the `clientRegistry` or the resolved base URL must be passed in or injected.
- Open question: should `AssetDownloadJob` support retry (like `ResourceRequestJob`) or be exhausted after one failure (like `ActionProcessingJob`)? The issue implies standard retry behaviour.
