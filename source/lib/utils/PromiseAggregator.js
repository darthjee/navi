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
   * Waits for all registered promises to settle.
   * If one or more promises reject, it still waits for the remaining
   * ones and then re-throws the first rejection error.
   * @returns {Promise<void>}
   */
  async wait() {
    const results = await Promise.allSettled(this.#promises);
    const firstRejection = results.find((r) => r.status === 'rejected');

    if (firstRejection) {
      throw firstRejection.reason;
    }
  }
}

export { PromiseAggregator };
