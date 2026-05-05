# Plan: Enqueuers — Handle Pagination

## 1. `PaginatedActionEnqueuer`

**File:** `source/lib/enqueuers/PaginatedActionEnqueuer.js`

Mirrors `ActionEnqueuer`. Enqueues **one** `PaginatedActionProcessingJob` for the whole response wrapper — **not one per item**. The job will later evaluate the page count from the response and enqueue one `ResourceRequestJob` per page.

```js
import { JobRegistry as DefaultJobRegistry } from '../background/JobRegistry.js';
import { Application } from '../services/Application.js';

/**
 * Enqueues one PaginatedActionProcessingJob for a single paginated action.
 * @author darthjee
 */
class PaginatedActionEnqueuer {
  #paginatedAction;
  #responseWrapper;
  #jobRegistry;

  /**
   * @param {ResourceRequestPaginatedAction} paginatedAction
   * @param {ResponseWrapper} responseWrapper The original full response (not split into items).
   * @param {object} [jobRegistry=JobRegistry]
   */
  constructor(paginatedAction, responseWrapper, jobRegistry = DefaultJobRegistry) {
    this.#paginatedAction = paginatedAction;
    this.#responseWrapper = responseWrapper;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one PaginatedActionProcessingJob for the response wrapper.
   * Does nothing if the application is stopped.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    this.#jobRegistry.enqueue('PaginatedAction', {
      paginatedAction: this.#paginatedAction,
      responseWrapper: this.#responseWrapper,
    });
  }
}

export { PaginatedActionEnqueuer };
```

---

## 2. `PaginatedActionsEnqueuer`

**File:** `source/lib/enqueuers/PaginatedActionsEnqueuer.js`

Mirrors `ActionsEnqueuer`. Receives the original `ResponseWrapper` and enqueues one `PaginatedActionProcessingJob` per `paginatedAction` (not per response item).

```js
import { PaginatedActionEnqueuer } from './PaginatedActionEnqueuer.js';
import { NullResponse } from '../exceptions/NullResponse.js';

/**
 * Enqueues one PaginatedActionProcessingJob per paginatedAction for the response wrapper.
 * @author darthjee
 */
class PaginatedActionsEnqueuer {
  #paginatedActions;
  #responseWrapper;
  #jobRegistry;

  /**
   * @param {Array<ResourceRequestPaginatedAction>} paginatedActions
   * @param {ResponseWrapper} responseWrapper The original full response.
   * @param {object} [jobRegistry]
   */
  constructor(paginatedActions, responseWrapper, jobRegistry) {
    this.#paginatedActions = paginatedActions;
    this.#responseWrapper = responseWrapper;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * @returns {void}
   * @throws {NullResponse} If the response wrapper is null.
   */
  enqueue() {
    if (this.#responseWrapper === null) throw new NullResponse();

    for (const paginatedAction of this.#paginatedActions) {
      new PaginatedActionEnqueuer(paginatedAction, this.#responseWrapper, this.#jobRegistry).enqueue();
    }
  }
}

export { PaginatedActionsEnqueuer };
```
