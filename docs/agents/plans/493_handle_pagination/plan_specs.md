# Plan: Specs — Handle Pagination

## 1. `PaginationConfig_spec.js`

**File:** `source/spec/lib/models/PaginationConfig_spec.js`

### `.fromList`

- when called with a list containing `pages`, `page_key`, and `zero_indexed` — returns a `PaginationConfig` instance
- when `zero_indexed` is omitted — defaults to `false` (1-based)

### `#resolvePages`

- resolves a `parsedBody` path expression and returns the numeric value
- resolves a `headers` bracket-notation path expression and returns the numeric value
- throws `MissingMappingVariable` when the expression path is absent from the wrapper

### `#pageNumbers`

- when `zero_indexed` is `false` — returns `[1, 2, ..., count]`
- when `zero_indexed` is `true` — returns `[0, 1, ..., count - 1]`
- when count is `1` and `zero_indexed` is `false` — returns `[1]`
- when count is `1` and `zero_indexed` is `true` — returns `[0]`

---

## 2. `ResourceRequestPaginatedAction_spec.js`

**File:** `source/spec/lib/models/ResourceRequestPaginatedAction_spec.js`

### `constructor`

- throws `MissingActionResource` when `resource` is undefined/falsy

### `.fromList`

- when called with `undefined` — returns an empty array
- when called with an empty array — returns an empty array
- when all entries are valid — returns one instance per entry
- when one entry is missing `resource` — logs the error and skips that entry

### `#execute`

Setup: `responseWrapper` with `parsedBody: { pagination: { pages: 3 } }`, `headers: {}`, `parameters: {}`

**Basic pagination (1-based, no existing params):**
- enqueues 3 `ResourceRequestJob`s (pages 1, 2, 3)
- each job receives `{ page_number: 1 }`, `{ page_number: 2 }`, `{ page_number: 3 }` as parameters

**Zero-indexed pagination:**
- enqueues jobs with pages 0, 1, 2

**With existing parameters on the item (`parameters: { id: 42 }`):**
- merges page into existing params: `{ id: 42, page_number: 1 }`, `{ id: 42, page_number: 2 }`, …

**With multiple ResourceRequests in the target resource:**
- enqueues `count × resourceRequests.length` jobs total

**When the target resource is not found:**
- throws `ResourceNotFound`

**When the `pages` expression is missing from the wrapper:**
- throws `MissingMappingVariable`

**When the application is stopped:**
- does not enqueue any job

---

## 3. `PaginatedActionProcessingJob_spec.js`

**File:** `source/spec/lib/jobs/PaginatedActionProcessingJob_spec.js`

### `#constructor`

- stores the id
- is an instance of `Job`

### `#maxRetries`

- returns `1`

### `#arguments`

- returns `{ item }`

### `#perform` — when the action succeeds

- calls `paginatedAction.execute` with the item
- clears `lastError` before performing
- does not exhaust after a successful attempt

### `#perform` — when the action throws

- sets `lastError` to the thrown error
- rethrows the error
- is exhausted after one failure

### `#exhausted`

- returns `false` with zero attempts
- returns `true` after one failed attempt

---

## 4. `PaginatedActionEnqueuer_spec.js`

**File:** `source/spec/lib/enqueuers/PaginatedActionEnqueuer_spec.js`

### `#enqueue`

- when items is an empty array — does not call `JobRegistry.enqueue`
- when there is a single item — calls `enqueue` once with `'PaginatedAction'`, the action, and the item
- when there are multiple items — calls `enqueue` once per item, each with the correct item
- when the application is stopped — does not call `JobRegistry.enqueue`

---

## 5. `PaginatedActionsEnqueuer_spec.js`

**File:** `source/spec/lib/enqueuers/PaginatedActionsEnqueuer_spec.js`

### `#enqueue`

- when items is `null` — throws `NullResponse`
- when items is an empty array and there are actions — does not call `JobRegistry.enqueue`
- when there is a single action and a single item — calls `enqueue` once
- when there are multiple actions — calls `enqueue` once per `(action × item)` pair
- when the application is stopped — does not call `JobRegistry.enqueue` (delegated via `PaginatedActionEnqueuer`)

---

## 6. `ResourceRequest_spec.js` — additions

**File:** `source/spec/lib/models/ResourceRequest_spec.js`

### `constructor` — `paginated_actions`

- when `paginated_actions` is omitted — `paginatedActions` is an empty array
- when valid `paginated_actions` entries are provided — creates `ResourceRequestPaginatedAction` instances

### `#enqueuePaginatedActions`

- when `paginatedActions` is empty — does not call `PaginatedActionsEnqueuer`
- when there are paginated actions — calls `PaginatedActionsEnqueuer.enqueue` with the item wrappers

---

## 7. `ResourceRequestJob_spec.js` — additions

**File:** `source/spec/lib/jobs/ResourceRequestJob_spec.js`

### `#perform` — with `paginated_actions`

- calls `enqueuePaginatedActions` on the resource request after a successful response
- does not call `enqueuePaginatedActions` when the resource request has none configured
