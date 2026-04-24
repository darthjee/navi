# Issue: Fetch CSS from HTML Responses

## Description

When Navi performs a resource request, the response is not always a JSON document. HTML pages include `<link>` tags for stylesheets, `<script>` tags for JavaScript bundles, and `<img>` tags for images. These are browser-fetched assets that a CDN or cache layer needs to have populated before real users arrive.

Currently, `ResponseParser` assumes every response body is valid JSON and throws `InvalidResponseBody` otherwise. HTML responses are therefore unusable as a source of further requests. To warm these assets, Navi must be able to recognise HTML responses, parse them, extract asset URLs using CSS selectors, and enqueue one `ResourceRequestJob` per discovered asset URL.

## Problem

- `ResponseParser` throws `InvalidResponseBody` for non-JSON (e.g. HTML) responses.
- HTML pages contain asset references (`<link>`, `<script>`, `<img>`) that Navi cannot currently extract or warm.
- There is no mechanism to declare asset-extraction rules in the YAML configuration.

## Expected Behavior

- A new optional `assets` key on a `ResourceRequest` YAML entry declares CSS-selector-based extraction rules.
- When `assets` is present, the response is treated as HTML and asset URLs are discovered and enqueued as `ResourceRequestJob` instances.
- A resource may declare both `assets` and `actions`; both sets of jobs run independently.

## Solution

### New configuration format

```yaml
resources:
  homepage:
    - url: /
      status: 200
      assets:
        - selector: "link[rel='stylesheet']"
          attribute: href
          client: cdn
          status: 200
        - selector: "script[src]"
          attribute: src
          client: cdn
        - selector: "img[src]"
          attribute: src
          client: cdn
```

### New concepts required

The asset pipeline mirrors the existing `actions` pipeline and is fully asynchronous, introducing two new job types:

| Concept | Description |
|---------|-------------|
| `AssetRequest` model | Holds `selector`, `attribute`, optional `client`, optional `status` (default `200`). Parsed from YAML by `ConfigParser`. |
| `HtmlParser` | Parses raw HTML using a DOM library (e.g. `node-html-parser` or `cheerio`). Applies a CSS selector and returns all matching attribute values as a string array. |
| `HtmlParseJob` *(new job type 1)* | Analogous to `ActionProcessingJob`. Receives the raw HTML body + list of `AssetRequest` rules. When executed, calls `HtmlParser` and enqueues one `AssetDownloadJob` per discovered URL. |
| `AssetDownloadJob` *(new job type 2)* | Analogous to `ResourceRequestJob`. Fetches a single fully-resolved asset URL, validates the expected HTTP status, and does **no** further chaining (leaf node). |

### Async flow (mirrors `actions`)

```
ResourceRequestJob (HTML response received)
  └─► enqueue HtmlParseJob(rawHtml, assetRequests)   ← async, same as ActionProcessingJob

HtmlParseJob (executed by worker)
  └─► HtmlParser.parse(rawHtml, selector, attribute)
       └─► for each discovered URL:
             enqueue AssetDownloadJob(url, client, status)

AssetDownloadJob (executed by worker)
  └─► performs HTTP request, validates status
       (no further chaining)
```

### Changes to existing code

- `ResourceRequest.fromObject()` — parse the optional `assets` list into `AssetRequest[]`.
- `ResourceRequestJob.perform()` — after a successful response, if the request has `assets`, enqueue one `HtmlParseJob` (alongside any existing `ActionProcessingJob` enqueuing). `ResponseParser` is **not** called when `assets` is configured.
- `ConfigParser` — build `AssetRequest` instances when the `assets` key is present.

### URL resolution for assets

- **Absolute** (e.g. `https://static.example.com/app.css`) — used as-is.
- **Root-relative** (e.g. `/assets/app.css`) — concatenated with the client's `base_url`.
- **Protocol-relative** (e.g. `//static.example.com/app.css`) — treated as HTTPS.

### Error handling

| Situation | Behaviour |
|-----------|-----------|
| HTML cannot be parsed | Throw `InvalidHtmlResponseBody` (extends `AppError`). |
| Selector matches zero elements | Log a warning; no jobs enqueued. |
| `attribute` missing on matched element | Skip element; log a warning. |
| Asset fetch returns unexpected status | Standard `RequestFailed` path (retry / dead). |

## Acceptance Criteria

- [ ] `AssetRequest` model parsed from YAML with `selector`, `attribute`, optional `client` and optional `status`.
- [ ] `HtmlParser` extracts attribute values for a given CSS selector from a raw HTML string.
- [ ] `HtmlParseJob` is enqueued by `ResourceRequestJob` when `assets` is configured (HTML response path).
- [ ] `HtmlParseJob` calls `HtmlParser` and enqueues one `AssetDownloadJob` per discovered URL.
- [ ] `AssetDownloadJob` fetches a single asset URL and validates the expected HTTP status.
- [ ] `AssetDownloadJob` respects the `client` field from the `AssetRequest` (falls back to `default`).
- [ ] A `ResourceRequest` with both `assets` and `actions` enqueues both `HtmlParseJob` and `ActionProcessingJob` sets independently.
- [ ] `InvalidHtmlResponseBody` thrown when the HTML cannot be parsed.
- [ ] Unit tests cover `HtmlParser`, `HtmlParseJob`, `AssetDownloadJob`, `AssetRequest`, and the updated `ResourceRequestJob` flow.
- [ ] `flow.md` and `overview.md` updated to reflect the new asset-fetch capability.

## Benefits

- Enables Navi to warm browser-fetched assets (CSS, JS, images) discovered from HTML pages.
- Extends resource-chaining to HTML responses, complementing the existing JSON-based `actions` mechanism.
- Keeps configuration declarative — asset rules live in the same YAML structure as resource definitions.

---
See issue for details: https://github.com/darthjee/navi/issues/331
