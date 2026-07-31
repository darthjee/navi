# Actions and Assets

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
