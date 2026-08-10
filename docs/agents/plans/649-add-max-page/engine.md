# Engine Plan: Add max page

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce: a `maxPage` field on `ResourceRequest`, parsed from the YAML key `max_page`, sanitized once at construction time (positive integer or `null`; anything else becomes `null` and, if the raw value was present, logs one `LogRegistry.warn`). See [plan.md](plan.md)'s "Shared contracts" for the full field spec `docs` relies on.

## Implementation Steps

### Step 1 — Add `maxPage` to `ResourceRequest`

In `source/lib/models/request/ResourceRequest.js`:

- Add a `#maxPage` private field.
- Destructure `max_page` in the constructor and sanitize it with a new private method:

```js
#sanitizeMaxPage(value) {
  if (value === undefined || value === null || value === 0) return null;
  if (Number.isInteger(value) && value > 0) return value;

  LogRegistry.warn(`Ignoring invalid max_page value: ${JSON.stringify(value)} — treating as unlimited`);
  return null;
}
```

- Set `this.#maxPage = this.#sanitizeMaxPage(max_page);` in the constructor, and add a `get maxPage()` getter returning it.
- New import: `LogRegistry` from `../../registry/LogRegistry.js`.
- Add JSDoc for the new constructor param, private field, and getter, matching the style already used for `disabled`/`enabled`.

### Step 2 — Add `zeroIndexed` getter to `PaginationConfig`

In `source/lib/models/configs/PaginationConfig.js`, add:

```js
/**
 * @returns {boolean} Whether pages are zero-indexed.
 */
get zeroIndexed() {
  return this.#zeroIndexed;
}
```

`#zeroIndexed` is already a private field set in the constructor — this just exposes it, needed by Step 4.

### Step 3 — Create the `PageRange` class

New file `source/lib/models/configs/PageRange.js`:

```js
/**
 * Iterates over a range of page numbers, honoring zero-indexing and an optional cap.
 * @author darthjee
 */
class PageRange {
  #count;
  #zeroIndexed;
  #maxPage;

  /**
   * @param {object} params Range parameters.
   * @param {number} params.count Total number of pages available.
   * @param {boolean} [params.zeroIndexed=false] Whether pages start at 0 instead of 1.
   * @param {number|null} [params.maxPage=null] Caps iteration to the first `maxPage` pages. `null` means unlimited.
   */
  constructor({ count, zeroIndexed = false, maxPage = null }) {
    this.#count = count;
    this.#zeroIndexed = zeroIndexed;
    this.#maxPage = maxPage;
  }

  /**
   * Invokes callback once per page number, in order, honoring zeroIndexed and maxPage.
   * @param {Function} callback Called with each page number.
   * @returns {void}
   */
  each(callback) {
    const start = this.#zeroIndexed ? 0 : 1;
    const total = this.#maxPage !== null ? Math.min(this.#count, this.#maxPage) : this.#count;

    for (let i = 0; i < total; i++) {
      callback(start + i);
    }
  }
}

export { PageRange };
```

This never materializes an array — `each` calls straight into the callback, so a `max_page` cap on a resource with a huge resolved `count` doesn't allocate a huge array first.

### Step 4 — Retire `PaginationConfig#pageNumbers`, wire `PageRange` into `ResourceRequestPaginatedAction#execute`

Remove `PaginationConfig#pageNumbers` (superseded by `PageRange`).

In `source/lib/models/request/ResourceRequestPaginatedAction.js`, update `execute`:

```js
execute(responseWrapper, parameters = {}) {
  if (Application.isStopped()) return;

  const count = this.#pagination.resolvePages(responseWrapper);
  const resource = this.#namespaceMap.getResource(this.#originNamespace, this.#resource, this.#namespace);
  const mappedParameters = this.#mapper.map(responseWrapper);

  for (const resourceRequest of resource.resourceRequests) {
    if (resourceRequest.disabled) continue;

    new PageRange({
      count,
      zeroIndexed: this.#pagination.zeroIndexed,
      maxPage: resourceRequest.maxPage,
    }).each((page) => {
      const pageParameters = {
        ...parameters,
        ...mappedParameters,
        [this.#pagination.pageKey]: page,
      };
      this.#jobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: pageParameters });
    });
  }
}
```

New import: `PageRange` from `../configs/PageRange.js`.

Note the loop nesting inverts (`resourceRequest` outer, `page` inner instead of the reverse) — required because `max_page` is per-`resourceRequest`, so each one needs its own `PageRange`. The set of enqueued `(resourceRequest, page)` pairs is identical to before when no `max_page` is set; only the enqueue *order* changes (grouped by `resourceRequest` instead of by `page`). Existing specs assert with `toHaveBeenCalledWith` (order-independent), so this is safe — see Step 6.

## Files to Change

- `source/lib/models/request/ResourceRequest.js` — add `maxPage` field, `#sanitizeMaxPage`, getter, `LogRegistry` import.
- `source/lib/models/configs/PaginationConfig.js` — add `zeroIndexed` getter; remove `pageNumbers`.
- `source/lib/models/configs/PageRange.js` — new file.
- `source/lib/models/request/ResourceRequestPaginatedAction.js` — rewrite `execute` to use `PageRange`; new import.
- `source/spec/support/factories/ResourceRequestFactory.js` — add an optional `maxPage`/`max_page` param so specs can build `ResourceRequest`s with a cap set.
- `source/spec/lib/models/request/ResourceRequest_spec.js` — new `#maxPage` describe block, mirroring the existing `#disabled` table-driven style: positive integers pass through; `undefined`/`null`/`0` → `null` with no warning logged; negative/float/`NaN`/string/boolean/object → `null` with `LogRegistry.warn` called once (use `LoggerUtils.stubLoggerMethods()` to spy on it).
- `source/spec/lib/models/configs/PaginationConfig_spec.js` — remove the `#pageNumbers` describe block; add a `#zeroIndexed` describe block (defaults `false`; `true` when configured).
- `source/spec/lib/models/configs/PageRange_spec.js` — new file. Cover: 1-based default (`count: 3` → `1,2,3`), zero-indexed (`count: 3, zeroIndexed: true` → `0,1,2`), `maxPage` capping below `count` (`count: 10, maxPage: 2` → `1,2`), `maxPage` capping below `count` while zero-indexed (`count: 10, zeroIndexed: true, maxPage: 2` → `0,1`), `maxPage` >= `count` is a no-op (`count: 2, maxPage: 10` → `1,2`), `maxPage: null`/default is unlimited, `count: 0` calls the callback zero times.
- `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js` — update the table-driven `#execute` cases as needed (order-independent `toHaveBeenCalledWith` assertions should need no changes); add cases: a `resourceRequest` with `maxPage` set caps its own enqueued pages while a sibling `resourceRequest` on the same resource without `maxPage` still gets every page; `maxPage` composes correctly with `zero_indexed: true` pagination (first N pages starting at `0`).

## CI Checks

- `source`: `yarn install && npm run coverage` (CI job: `jasmine`) — runs the full Jasmine suite with coverage.
- `source`: `npm run lint` (CI job: `checks`) — ESLint.
- `source`: `npm run report` (CI job: `checks`) — JSCPD duplication report.

## Notes

- `Number.isInteger(value) && value > 0` is the exact "positive integer" check — `NaN`, `Infinity`, floats, strings, booleans, and negative numbers all fail it and fall through to the invalid-value branch.
- `PaginationConfig#pageNumbers` is removed rather than deprecated-and-kept, since nothing outside `ResourceRequestPaginatedAction#execute` calls it and the issue explicitly frames `PageRange` as its replacement.
- No change needed to `PaginationConfig`'s constructor or `.fromList` — `zeroIndexed` was already parsed, just not exposed.
