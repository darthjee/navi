# Tests: Fetch CSS from HTML Responses

## New spec files

### `source/spec/lib/exceptions/InvalidHtmlResponseBody_spec.js`
- Extends `AppError`.
- `error.name` equals `'InvalidHtmlResponseBody'`.

### `source/spec/lib/models/AssetRequest_spec.js`

`fromObject()`:
- With all fields (`selector`, `attribute`, `client`, `status`) — returns correct instance with all values set.
- With only required fields — `client` is `undefined`, `status` defaults to `200`.

`fromListObject()`:
- With a list of objects — returns an array of `AssetRequest` instances.
- With an empty list — returns an empty array.

### `source/spec/lib/utils/HtmlParser_spec.js`

`parse(rawHtml, selector, attribute)`:
- Returns the attribute value from a single matching element.
- Returns values from multiple matching elements as an array.
- Returns an empty array when no elements match the selector, and logs a warning.
- Skips elements that are missing the target attribute, logs a warning for each, and still returns values from elements that do have it.
- Throws `InvalidHtmlResponseBody` when the raw HTML cannot be parsed.

### `source/spec/lib/models/HtmlParseJob_spec.js`

`perform()`:
- Calls `HtmlParser.parse` once per `AssetRequest`.
- Enqueues one `AssetDownloadJob` per discovered URL.
- Absolute URLs (`https://…`) are enqueued as-is.
- Root-relative URLs (`/…`) are concatenated with the named client's `base_url` before enqueueing.
- Protocol-relative URLs (`//…`) are prepended with `https:` before enqueueing.
- When a selector matches zero elements, no `AssetDownloadJob` is enqueued for that rule.
- With multiple `AssetRequest` rules, URLs discovered across all rules are all enqueued.
- No retry rights — the job is exhausted after the first failure.

### `source/spec/lib/models/AssetDownloadJob_spec.js`

`perform()`:
- Makes an HTTP request to the given URL using the named client.
- Falls back to the `default` client when no `client` is specified.
- Validates the expected HTTP status; does not throw when status matches.
- Throws `RequestFailed` when the status does not match, following the standard retry/dead path.
- Is a leaf node — does not enqueue further jobs after a successful fetch.

## Updated spec files

### `source/spec/lib/models/ResourceRequest_spec.js`

`fromObject()`:
- With an `assets` list — parses into `AssetRequest[]`.
- Without an `assets` key — `assets` is an empty array; `hasAssets()` returns `false`.

`hasAssets()`:
- Returns `true` when the assets list is non-empty.
- Returns `false` when the assets list is empty.

`enqueueAssets(rawHtml, jobRegistry, clientRegistry)`:
- Enqueues one `HtmlParseJob` with the correct `rawHtml` and `assetRequests`.

### `source/spec/lib/models/ResourceRequestJob_spec.js`

`perform()` — assets only:
- When the request has `assets` and no `actions`: enqueues `HtmlParseJob`; does **not** call `ResponseParser`.

`perform()` — actions only:
- When the request has `actions` and no `assets`: existing behaviour unchanged (calls `ResponseParser`, enqueues `ActionProcessingJob`).

`perform()` — both:
- When the request has both `assets` and `actions`: enqueues both `HtmlParseJob` and `ActionProcessingJob` independently.

### `source/spec/lib/services/Application_spec.js`
- `HtmlParse` factory is registered during `loadConfig`.
- `AssetDownload` factory is registered during `loadConfig`.
