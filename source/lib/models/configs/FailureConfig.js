/**
 * Represents the failure threshold configuration for the application.
 * @author darthjee
 */
class FailureConfig {
  #threshold;

  /**
   * Creates an instance of FailureConfig.
   * @param {object} config - The configuration object.
   * @param {number} config.threshold - The maximum acceptable percentage of dead jobs (0–100).
   */
  constructor({ threshold }) {
    this.#threshold = threshold;
  }

  /**
   * Gets the failure threshold percentage.
   * @returns {number} The threshold value.
   */
  get threshold() {
    return this.#threshold;
  }

  /**
   * Creates a FailureConfig instance from a raw YAML object, or returns null if absent.
   * @param {object|null|undefined} obj - The raw failure config object from YAML.
   * @returns {FailureConfig|null} A new FailureConfig instance, or null if not configured.
   */
  static fromObject(obj) {
    if (!obj) return null;
    return new FailureConfig(obj);
  }
}

export { FailureConfig };
