# Plan: Enqueuers — Handle Pagination

## 1. `PaginatedActionEnqueuer`

**File:** `source/lib/enqueuers/PaginatedActionEnqueuer.js`

Mirrors `ActionEnqueuer`. Enqueues one `PaginatedActionProcessingJob` per item for a single `ResourceRequestPaginatedAction`.

```js
import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

/**
 * Enqueues one PaginatedActionProcessingJob per item for a single paginated action.
 * @author darthjee
 */
class PaginatedActionEnqueuer {
  #paginatedAction;
  #items;
  #jobRegistry;

  /**
   * @param {ResourceRequestPaginatedAction} paginatedAction
   * @param {Array<ResponseWrapper>} items
   * @param {object} [jobRegistry=JobRegistry]
   */
  constructor(paginatedAction, items, jobRegistry = DefaultJobRegistry) {
    this.#paginatedAction = paginatedAction;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob per item.
   * Does nothing if the application is stopped.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    for (const item of this.#items) {
      this.#jobRegistry.enqueue('PaginatedAction', { paginatedAction: this.#paginatedAction, item });
    }
  }
}

export { PaginatedActionEnqueuer };
```

---

## 2. `PaginatedActionsEnqueuer`

**File:** `source/lib/enqueuers/PaginatedActionsEnqueuer.js`

Mirrors `ActionsEnqueuer`. Receives a list of `ResponseWrapper` items and enqueues one `PaginatedActionProcessingJob` per `(item × paginatedAction)` pair.

```js
import { PaginatedActionEnqueuer } from './PaginatedActionEnqueuer.js';
import { NullResponse } from '../exceptions/NullResponse.js';

/**
 * Enqueues one PaginatedActionProcessingJob per (item × paginatedAction) pair.
 * @author darthjee
 */
class PaginatedActionsEnqueuer {
  #paginatedActions;
  #items;
  #jobRegistry;

  /**
   * @param {Array<ResourceRequestPaginatedAction>} paginatedActions
   * @param {Array<ResponseWrapper>} items
   * @param {object} [jobRegistry]
   */
  constructor(paginatedActions, items, jobRegistry) {
    this.#paginatedActions = paginatedActions;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * @returns {void}
   * @throws {NullResponse} If the items list is null.
   */
  enqueue() {
    if (this.#items === null) throw new NullResponse();

    for (const paginatedAction of this.#paginatedActions) {
      new PaginatedActionEnqueuer(paginatedAction, this.#items, this.#jobRegistry).enqueue();
    }
  }
}

export { PaginatedActionsEnqueuer };
```
