# Documentation: Fetch CSS from HTML Responses

## Internal docs

### `docs/agents/flow.md`
Add a new section describing the HTML asset-fetch flow:
- When `ResourceRequestJob` receives an HTML response and the request has `assets`, it enqueues an `HtmlParseJob`.
- `HtmlParseJob` runs, calls `HtmlParser` per `AssetRequest` rule, resolves URLs, and enqueues one `AssetDownloadJob` per URL.
- `AssetDownloadJob` fetches the asset and validates the HTTP status. No further chaining.

### `docs/agents/overview.md`
Mark the asset-fetch capability as implemented in the feature checklist.

### `docs/agents/architecture.md`

Add to the **`exceptions/`** hierarchy:
```
└── InvalidHtmlResponseBody  ← HTML response body could not be parsed
```

Add to the **`models/`** table:
| Class | Responsibility |
|-------|---------------|
| `AssetRequest` | Holds `selector`, `attribute`, optional `client`, optional `status` (default `200`). Parsed from YAML by `ResourceRequest.fromObject()`. |
| `HtmlParseJob` | Extends `Job`. Enqueued by `ResourceRequestJob` when the request has `assets`. Calls `HtmlParser` for each `AssetRequest`, resolves URLs, and enqueues one `AssetDownloadJob` per URL. No retry rights. |
| `AssetDownloadJob` | Extends `Job`. Fetches a single fully-resolved asset URL, validates HTTP status. Leaf node — no further chaining. Follows standard retry/dead path. |

Add to the **`utils/`** table:
| Class | Responsibility |
|-------|---------------|
| `HtmlParser` | Parses a raw HTML string using a DOM library. `parse(rawHtml, selector, attribute)` returns an array of attribute values from all matching elements. Throws `InvalidHtmlResponseBody` on parse failure. |

---

## Public-facing docs

### `README.md`

1. **Key features** — add bullet:
   - Asset warming from HTML responses: CSS selectors extract asset URLs (`<link>`, `<script>`, `<img>`) and each discovered URL is enqueued as a separate fetch job.

2. **Fields table** — add new rows after the `actions[].parameters` row:
   | Field | Description |
   |-------|-------------|
   | `assets` | Optional list of asset-extraction rules. When present, the response is treated as HTML instead of JSON. |
   | `assets[].selector` | CSS selector applied to the HTML document to find asset elements. Required. |
   | `assets[].attribute` | Attribute on the matched element that holds the asset URL (e.g. `href`, `src`). Required. |
   | `assets[].client` | Named client to use when fetching each asset. Defaults to `default`. |
   | `assets[].status` | Expected HTTP status for each asset fetch. Defaults to `200`. |

3. **Config example YAML** — add an `assets` example resource (e.g. `homepage`) alongside the existing `categories` example:
   ```yaml
   homepage:
     - url: /
       status: 200
       assets:
         - selector: "link[rel='stylesheet']"
           attribute: href
           client: cdn
         - selector: "script[src]"
           attribute: src
           client: cdn
         - selector: "img[src]"
           attribute: src
           client: cdn
   ```

4. **"Actions & Response Chaining" section** — add a parallel **"Asset Warming from HTML Responses"** section explaining:
   - When a resource declares `assets`, the HTML response body is parsed instead of JSON.
   - Each rule uses a CSS selector + attribute to discover URLs.
   - One `HtmlParseJob` is enqueued after the HTML response; it runs asynchronously and enqueues one `AssetDownloadJob` per URL.
   - URL forms supported: absolute, root-relative (concatenated with client `base_url`), protocol-relative (treated as HTTPS).
   - A resource may declare both `assets` and `actions`; both pipelines run independently.

---

### `source/README.md`

Apply the same changes as `README.md`:

1. **Key features** — add the asset-warming bullet.
2. **Fields table** — add the five `assets` / `assets[*]` rows.
3. **Config example YAML** — add the `homepage` assets example.
4. **"Resource Chaining" section** — extend (or add a subsection) to cover asset warming from HTML.

---

### `DOCKERHUB_DESCRIPTION.md`

Apply the same changes as `README.md`:

1. **Key features** — add the asset-warming bullet.
2. **Fields table** — add the five `assets` / `assets[*]` rows.
3. **Config example YAML** — add the `homepage` assets example.
4. **"Resource Chaining" section** — extend (or add a subsection) to cover asset warming from HTML.
