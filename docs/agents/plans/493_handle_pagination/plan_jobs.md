# Plan: Jobs — Handle Pagination

## `PaginatedActionProcessingJob`

**File:** `source/lib/jobs/PaginatedActionProcessingJob.js`

Mirrors `ActionProcessingJob`. Processes a single `(paginatedAction, item)` pair. Exhausted after the first failure — no retry rights.

```js
import { Job } from '../background/Job.js';

/**
 * Processes a single paginated action for a given response item.
 * Exhausted after the first failure — no retry rights.
 * @author darthjee
 */
class PaginatedActionProcessingJob extends Job {
  #paginatedAction;
  #item;

  /**
   * @param {object} params
   * @param {string} params.id Unique job identifier.
   * @param {ResourceRequestPaginatedAction} params.paginatedAction The paginated action to execute.
   * @param {ResponseWrapper} params.item The response item to process.
   */
  constructor({ id, paginatedAction, item }) {
    super({ id });
    this.#paginatedAction = paginatedAction;
    this.#item = item;
  }

  /**
   * @returns {{ item: ResponseWrapper }}
   */
  get arguments() {
    return { item: this.#item };
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
      await this.#paginatedAction.execute(this.#item);
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
JobFactory.build('PaginatedAction', ({ id, paginatedAction, item }) =>
  new PaginatedActionProcessingJob({ id, paginatedAction, item })
);
```
