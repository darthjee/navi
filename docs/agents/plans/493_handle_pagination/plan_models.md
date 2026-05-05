# Plan: Models — Handle Pagination

## 1. `PaginationConfig`

**File:** `source/lib/models/PaginationConfig.js`

Parses the `pagination` block from YAML and resolves the total page count against a response wrapper.

```js
import { PathResolver } from './PathResolver.js';

class PaginationConfig {
  #pagesResolver;
  #pageKey;
  #zeroIndexed;

  constructor({ pages, page_key, zero_indexed = false }) {
    this.#pagesResolver = PathResolver.fromExpression(pages);
    this.#pageKey = page_key;
    this.#zeroIndexed = zero_indexed;
  }

  /** @returns {string} The parameter name used to inject the page number. */
  get pageKey() {
    return this.#pageKey;
  }

  /**
   * Evaluates the `pages` expression against the response wrapper.
   * @param {ResponseWrapper} responseWrapper
   * @returns {number} Total number of pages.
   */
  resolvePages(responseWrapper) {
    return this.#pagesResolver.resolve(responseWrapper);
  }

  /**
   * Returns an array of page numbers to iterate over.
   * @param {number} count Total number of pages.
   * @returns {Array<number>}
   */
  pageNumbers(count) {
    const start = this.#zeroIndexed ? 0 : 1;
    const end = this.#zeroIndexed ? count - 1 : count;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * Creates a PaginationConfig from a raw YAML list entry.
   * The YAML block is a list of single-key maps, e.g.:
   *   - pages: parsedBody.pagination.pages
   *   - page_key: page_number
   *   - zero_indexed: false
   * @param {Array<object>} list
   * @returns {PaginationConfig}
   */
  static fromList(list) {
    const attrs = Object.assign({}, ...list);
    return new PaginationConfig(attrs);
  }
}

export { PaginationConfig };
```

### YAML representation

```yaml
pagination:
  - pages: parsedBody.pagination.pages
  - page_key: page_number
  - zero_indexed: false
```

---

## 2. `ResourceRequestPaginatedAction`

**File:** `source/lib/models/ResourceRequestPaginatedAction.js`

Mirrors `ResourceRequestAction` but iterates over pages and enqueues one `ResourceRequestJob` per page, merging the page number into the item's existing parameters.

```js
import { PaginationConfig } from './PaginationConfig.js';
import { MissingActionResource } from '../exceptions/MissingActionResource.js';
import { LogRegistry } from '../registry/LogRegistry.js';
import { ResourceRegistry as DefaultResourceRegistry } from '../registry/ResourceRegistry.js';
import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

class ResourceRequestPaginatedAction {
  #resource;
  #pagination;
  #jobRegistry;
  #resourceRegistry;

  constructor({
    resource,
    pagination,
    jobRegistry = DefaultJobRegistry,
    resourceRegistry = DefaultResourceRegistry,
  }) {
    if (!resource) throw new MissingActionResource();
    this.#resource = resource;
    this.#pagination = PaginationConfig.fromList(pagination);
    this.#jobRegistry = jobRegistry;
    this.#resourceRegistry = resourceRegistry;
  }

  /**
   * Evaluates the page count from the response, then enqueues one
   * ResourceRequestJob per page for the target resource.
   * @param {ResponseWrapper} responseWrapper
   * @returns {void}
   */
  execute(responseWrapper) {
    if (Application.isStopped()) return;

    const count = this.#pagination.resolvePages(responseWrapper);
    const pages = this.#pagination.pageNumbers(count);
    const resource = this.#resourceRegistry.getItem(this.#resource);
    const existingParams = responseWrapper.parameters ?? {};

    for (const page of pages) {
      const parameters = { ...existingParams, [this.#pagination.pageKey]: page };
      for (const resourceRequest of resource.resourceRequests) {
        this.#jobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters });
      }
    }
  }

  /**
   * Creates instances from a raw YAML list, skipping invalid entries.
   * @param {Array<object>} array
   * @returns {Array<ResourceRequestPaginatedAction>}
   */
  static fromList(array = []) {
    return array.flatMap((attrs) => {
      try {
        return [new ResourceRequestPaginatedAction(attrs)];
      } catch (error) {
        LogRegistry.error(`Skipping paginated_action: ${error}`);
        return [];
      }
    });
  }
}

export { ResourceRequestPaginatedAction };
```

---

## 3. Extend `ResourceRequest`

**File:** `source/lib/models/ResourceRequest.js`

Add `paginated_actions` parsing and the `enqueuePaginatedActions` method.

### Changes to constructor

```js
// add import at top
import { ResourceRequestPaginatedAction } from './ResourceRequestPaginatedAction.js';
import { PaginatedActionsEnqueuer } from '../enqueuers/PaginatedActionsEnqueuer.js';

// inside constructor, add:
constructor({ url, status, clientName, actions = [], assets = [], paginated_actions = [] }) {
  // ... existing lines ...
  this.paginatedActions = ResourceRequestPaginatedAction.fromList(paginated_actions);
}
```

### New method

```js
/**
 * Enqueues one PaginatedActionProcessingJob per paginated action.
 * Passes the original full responseWrapper — not split into items.
 * Returns immediately if there are no paginated actions.
 * @param {ResponseWrapper} responseWrapper
 * @returns {void}
 */
enqueuePaginatedActions(responseWrapper) {
  if (this.paginatedActions.length === 0) return;

  new PaginatedActionsEnqueuer(this.paginatedActions, responseWrapper).enqueue();
}
```

### Call site — `ResourceRequestJob`

In `ResourceRequestJob.perform()`, call `enqueuePaginatedActions` alongside the existing `enqueueActions`:

```js
resourceRequest.enqueueActions(responseWrapper);
resourceRequest.enqueuePaginatedActions(responseWrapper);
```
