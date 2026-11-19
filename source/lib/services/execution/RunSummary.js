/**
 * RunSummary computes and formats final run metrics for output at application end.
 * @author darthjee
 */
class RunSummary {
  #stats;
  #threshold;

  /**
   * @param {object} params - Construction parameters.
   * @param {LifetimeJobStats} params.stats - Lifetime job stats for the run.
   * @param {number|null} [params.threshold=null] - Failure threshold percentage.
   */
  constructor({ stats, threshold = null }) {
    this.#stats = stats;
    this.#threshold = threshold;
  }

  /**
   * Returns the failure percentage for this run (dead over total, in-flight excluded).
   * @returns {number} Failure percentage (0–100).
   */
  percentage() {
    return this.#stats.percentage;
  }

  /**
   * Returns the run result according to the configured threshold.
   * @returns {'Success'|'Failure'} Run result label.
   */
  result() {
    if (this.#threshold === null || this.#threshold === undefined) return 'Success';
    return this.percentage() > this.#threshold ? 'Failure' : 'Success';
  }

  /**
   * Returns the multi-line summary message, with optional Unresolved and
   * Pending lines when there are in-flight or not-yet-completed jobs.
   * @returns {string} Formatted run summary.
   */
  report() {
    return [
      `Total: ${this.#stats.total}`,
      `Failed: ${this.#stats.dead} (${this.#format(this.percentage())}%)`,
      ...this.#unresolvedLines(),
      ...this.#pendingLines(),
      `Threshold: ${this.#formatThreshold()}`,
      `Result: ${this.result()}`,
    ].join('\n');
  }

  /**
   * @returns {string[]} The Unresolved line, only when there are in-flight jobs.
   */
  #unresolvedLines() {
    if (this.#stats.unresolved > 0) return [`Unresolved: ${this.#stats.unresolved}`];
    return [];
  }

  /**
   * @returns {string[]} The Pending line, only when there are pending jobs.
   */
  #pendingLines() {
    if (this.#stats.pending > 0) return [`Pending: ${this.#stats.pending}`];
    return [];
  }

  /**
   * @param {number} value - Numeric value to format.
   * @returns {string} Rounded string without unnecessary trailing zeroes.
   */
  #format(value) {
    return `${Number(value.toFixed(2))}`;
  }

  /**
   * @returns {string} Formatted threshold line value.
   */
  #formatThreshold() {
    if (this.#threshold === null || this.#threshold === undefined) return 'N/A';
    return `${this.#format(this.#threshold)}%`;
  }
}

export { RunSummary };
