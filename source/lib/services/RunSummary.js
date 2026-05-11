/**
 * RunSummary computes and formats final run metrics for output at application end.
 * @author darthjee
 */
class RunSummary {
  #totalJobs;
  #failedJobs;
  #threshold;

  /**
   * @param {object} params - Construction parameters.
   * @param {number} params.totalJobs - Total processed jobs.
   * @param {number} params.failedJobs - Total failed jobs (failed + retry + dead).
   * @param {number|null} [params.threshold=null] - Failure threshold percentage.
   */
  constructor({ totalJobs, failedJobs, threshold = null }) {
    this.#totalJobs = totalJobs;
    this.#failedJobs = failedJobs;
    this.#threshold = threshold;
  }

  /**
   * Returns the failure percentage for this run.
   * @returns {number} Failure percentage (0–100).
   */
  percentage() {
    if (this.#totalJobs === 0) return 0;
    return (this.#failedJobs / this.#totalJobs) * 100;
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
   * Returns the multi-line summary message.
   * @returns {string} Formatted run summary.
   */
  report() {
    return [
      `Total: ${this.#totalJobs}`,
      `Failed: ${this.#failedJobs} (${this.#format(this.percentage())}%)`,
      `Threshold: ${this.#formatThreshold()}`,
      `Result: ${this.result()}`,
    ].join('\n');
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
