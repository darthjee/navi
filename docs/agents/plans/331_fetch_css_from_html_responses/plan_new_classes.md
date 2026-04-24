# New Classes: Fetch CSS from HTML Responses

## Step 1 — Add `InvalidHtmlResponseBody` exception

Create `source/lib/exceptions/InvalidHtmlResponseBody.js` extending `AppError`.
Add it to the exception hierarchy in `docs/agents/architecture.md`.

## Step 2 — Add `AssetRequest` model

Create `source/lib/models/AssetRequest.js` with:
- Fields: `selector` (string), `attribute` (string), `client` (optional string), `status` (optional number, default `200`).
- Static factory `AssetRequest.fromObject(obj)`.
- Static factory `AssetRequest.fromListObject(list)`.

## Step 3 — Add `HtmlParser` utility

Create `source/lib/utils/HtmlParser.js`.
- `HtmlParser.parse(rawHtml, selector, attribute)` — uses a DOM library (`node-html-parser` or `cheerio`) to find all elements matching `selector` and returns an array of the `attribute` value from each matched element.
- Throws `InvalidHtmlResponseBody` if the HTML cannot be parsed.
- Logs a warning via `Logger` when the selector matches zero elements.
- Logs a warning via `Logger` and skips silently when a matched element is missing the target attribute.

## Step 4 — Add `HtmlParseJob`

Create `source/lib/models/HtmlParseJob.js` extending `Job`.

Constructor receives: `rawHtml` (string), `assetRequests` (array of `AssetRequest`), `jobRegistry`, `clientRegistry`.

`perform()`:
1. For each `AssetRequest`, call `HtmlParser.parse(rawHtml, selector, attribute)`.
2. Resolve each discovered URL (see URL resolution below).
3. Enqueue one `AssetDownloadJob` per resolved URL via `JobRegistry.enqueue('AssetDownload', { url, client, status })`.

No retry rights — exhausted after the first failure (analogous to `ActionProcessingJob`).

## Step 5 — Add `AssetDownloadJob`

Create `source/lib/models/AssetDownloadJob.js` extending `Job`.

Constructor receives: `url` (fully-resolved string), `client` (optional string, defaults to `'default'`), `status` (number), `clientRegistry`.

`perform()`: fetches the URL via the named `Client`, validates HTTP status. Follows the standard `RequestFailed` → retry / dead path on failure.

Leaf node — no further chaining after a successful fetch.

## Step 6 — URL resolution

Inside `HtmlParseJob.perform()`, normalise each discovered URL before enqueueing:

| Form | Example | Resolution |
|------|---------|------------|
| Absolute | `https://cdn.example.com/app.css` | Use as-is; ignore client `base_url`. |
| Protocol-relative | `//cdn.example.com/app.css` | Prepend `https:`. |
| Root-relative | `/assets/app.css` | Concatenate with the named client's `base_url`. |
