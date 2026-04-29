/**
 * Collects promises and exposes a single wait() method that resolves
 * only after all registered promises have settled.
 *
 * @author darthjee
 */
class PromiseAggregator {
  #promises = [];

  /**
   * Registers a promise into the collection.
   * Silently ignores null and undefined values.
   * @param {Promise|null|undefined} promise - The promise to add.
   * @returns {void}
   */
  add(promise) {
    if (promise === null || promise === undefined) return;
    this.#promises.push(promise);
  }

  /**
   * Waits for all registered promises to settle, including any added during the wait.
   * Loops until the internal list is empty, draining settled promises each iteration.
   * If one or more promises reject, it still waits for the remaining
   * ones and then re-throws the first rejection error.
   * @returns {Promise<void>}
   */
  async wait() {
    while (this.#promises.length > 0) {
      const current = [...this.#promises];
      const results = await Promise.allSettled(current);

      this.#promises = this.#promises.filter((p) => !current.includes(p));

      const firstRejection = results.find((r) => r.status === 'rejected');
      if (firstRejection) {
        throw firstRejection.reason;
      }
    }
  }
}

export { PromiseAggregator };
