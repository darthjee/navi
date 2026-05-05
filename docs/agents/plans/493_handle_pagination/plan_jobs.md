# Plan: Jobs — Handle Pagination

## `PaginatedActionProcessingJob`

**File:** `source/lib/jobs/PaginatedActionProcessingJob.js`

Mirrors `ActionProcessingJob`. Processes a single `(paginatedAction, responseWrapper)` pair — the `responseWrapper` is the **original full response**, not a single item. `execute` evaluates the page count from the response and enqueues one `ResourceRequestJob` per page. Exhausted after the first failure — no retry rights.

```js
import { Job } from '../background/Job.js';

/**
 * Processes a single paginated action against the original full response wrapper.
 * Evaluates page count and enqueues one ResourceRequestJob per page.
 * Exhausted after the first failure — no retry rights.
 * @author darthjee
 */
class PaginatedActionProcessingJob extends Job {
  #paginatedAction;
  #responseWrapper;

  /**
   * @param {object} params
   * @param {string} params.id Unique job identifier.
   * @param {ResourceRequestPaginatedAction} params.paginatedAction The paginated action to execute.
   * @param {ResponseWrapper} params.responseWrapper The original full response wrapper.
   */
  constructor({ id, paginatedAction, responseWrapper }) {
    super({ id });
    this.#paginatedAction = paginatedAction;
    this.#responseWrapper = responseWrapper;
  }

  /**
   * @returns {{ responseWrapper: ResponseWrapper }}
   */
  get arguments() {
    return { responseWrapper: this.#responseWrapper };
  }

  /**
   * Exhausted after first failure.
   * @returns {number} Always 1.
   * @override
   */
  get maxRetries() {
    return 1;
  }

  /**
   * @param {LogContext} logContext
   * @returns {Promise<void>}
   */
  async perform(logContext) {
    logContext.debug(`PaginatedActionProcessingJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      await this.#paginatedAction.execute(this.#responseWrapper);
    } catch (error) {
      this._fail(error);
    }
  }
}

export { PaginatedActionProcessingJob };
```

## Factory registration

In the bootstrap/factory registration file, register the `'PaginatedAction'` key:

```js
JobFactory.build('PaginatedAction', ({ id, paginatedAction, responseWrapper }) =>
  new PaginatedActionProcessingJob({ id, paginatedAction, responseWrapper })
);
```
