# Actions and Assets

## Extraction and Emit

When a `ResourceRequest` declares `parser` (and optionally `emit`), the response body is
treated as structured data to extract:

1. `ExtractionJob` resolves the parser implementation from `ParserRegistry` by `parser.type`
   (`regex` or `json_path`) and calls `parserImpl.extract(rawBody, parser.attributes)`,
   producing an array of `ExtractedItem`s (flat `{ field: value }` objects).
2. When the resource also declares `emit`, `ExtractionJob` delegates to
   `new EmitEnqueuer(items, emit, parameters, jobRegistry).enqueue()`, which enqueues one
   `EmitJob` per extracted item, forwarding the resource's `emit` config and the original
   request's `parameters` (the same ones already threaded into actions/paginated actions).
   When `emit` is absent, the extracted items are only logged — no jobs are enqueued.
3. `EmitJob` resolves `emit.url` against `parameters` (the same `{:placeholder}` substitution
   used for regular resource requests) and sends the extracted item as the JSON body via
   `Client.emit(method, url, item, status, logContext)`.

`ExtractionJob` has **no retry rights** — exhausted on the first failure, like
`ActionProcessingJob`/`HtmlParseJob`. `EmitJob` is a leaf node with the standard retry/dead
path, like `AssetDownloadJob`.

The extraction→emit branch is independent of the actions branch: `ResourceRequestJob` enqueues
extraction and actions off the same response in `#handleResponse`, so a resource can:

- Have only `actions` (pure cache-warming — unaffected by `parser`/`emit`).
- Have only `parser` + `emit` (pure extraction — no chaining, no `ActionProcessingJob`).
- Have both (extraction and chaining run side by side, off the same response).

---

## Actions

`ActionProcessingJob.perform()` calls `action.execute(item)`:

1. `ParametersMapper` maps path expressions from the response to parameters.
2. Looks up the target resource in `ResourceRegistry`.
3. Enqueues one `ResourceRequestJob` per `ResourceRequest` in that resource with the mapped parameters.

`ActionProcessingJob` has **no retry rights** — exhausted on the first failure.

---

## Paginated Actions

`PaginatedActionProcessingJob.perform()` calls `paginatedAction.execute(responseWrapper)`:

1. `PaginationConfig.resolvePages(responseWrapper)` evaluates the `pages` expression → total page count.
2. `PaginationConfig.pageNumbers(count)` generates `[1..count]` or `[0..count-1]` depending on `zero_indexed`.
3. Enqueues one `ResourceRequestJob` per page, merging the page number under `page_key` into existing parameters.

`PaginatedActionProcessingJob` has **no retry rights**.

---

## Asset Processing

When a `ResourceRequest` declares `assets`, the response body is treated as HTML:

1. `HtmlParseJob` runs `HtmlParser.parse(rawHtml, selector, attribute)` for each rule.
2. Resolves each URL to absolute form: absolute → as-is; `//…` → prepend `https:`; `/…` → prepend client's `baseUrl`.
3. Enqueues one `AssetDownloadJob` per resolved URL.
4. `AssetDownloadJob` fetches the URL via `Client.performUrl()` — leaf node with standard retry/dead path.

`HtmlParseJob` has **no retry rights**.
