/**
 * LifetimeJobStats turns a JobRegistry.stats() object into lifetime counts
 * (resident plus pruned, since the last clearQueues()).
 * @author darthjee
 */
class LifetimeJobStats {
  #total;
  #dead;
  #unresolved;

  /**
   * Creates a new LifetimeJobStats instance.
   * @param {object} params - Construction parameters.
   * @param {number} params.total - Lifetime count of finished and dead jobs.
   * @param {number} params.dead - Lifetime count of dead jobs.
   * @param {number} params.unresolved - Count of in-flight jobs (failed + retryQueue).
   */
  constructor({ total, dead, unresolved }) {
    this.#total = total;
    this.#dead = dead;
    this.#unresolved = unresolved;
  }

  /**
   * Builds an instance from a JobRegistry.stats() object.
   * @param {object} stats - Result of JobRegistry.stats().
   * @returns {LifetimeJobStats} The lifetime stats.
   */
  static fromStats(stats) {
    return new LifetimeJobStats({
      total: stats.total + stats.pruned.finished + stats.pruned.dead,
      dead: stats.dead + stats.pruned.dead,
      unresolved: stats.failed + stats.retryQueue,
    });
  }

  /**
   * Lifetime count of finished and dead jobs (resident + pruned).
   * @returns {number} The total.
   */
  get total() {
    return this.#total;
  }

  /**
   * Lifetime count of dead jobs (resident + pruned).
   * @returns {number} The dead count.
   */
  get dead() {
    return this.#dead;
  }

  /**
   * Count of in-flight jobs (failed + retryQueue). It is not part of `total`;
   * whether it belongs in the failure ratio is tracked in #1029.
   * @returns {number} The unresolved count.
   */
  get unresolved() {
    return this.#unresolved;
  }
}

export { LifetimeJobStats };
