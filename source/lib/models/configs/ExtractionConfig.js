/**
 * Represents the top-level extraction-tracking configuration for the application.
 *
 * This `extraction:` key is a sibling of `resources` / `web` / `log` / `emit` and only
 * carries the retention limit for the extraction-tracking store.
 * @author darthjee
 */
class ExtractionConfig {
  #size;

  /**
   * Creates an instance of ExtractionConfig.
   * @param {object} [config={}] - The configuration object.
   * @param {number} [config.size=100] - The maximum number of extraction records to retain.
   */
  constructor({ size = 100 } = {}) {
    this.#size = size;
  }

  /**
   * Gets the maximum number of extraction records to retain.
   * @returns {number} The extraction store size.
   */
  get size() {
    return this.#size;
  }

  /**
   * Creates an ExtractionConfig instance from a raw YAML object.
   * @param {object|null|undefined} obj - The raw extraction config object from YAML.
   * @returns {ExtractionConfig} A new ExtractionConfig instance.
   */
  static fromObject(obj) {
    return new ExtractionConfig(obj ?? {});
  }
}

export { ExtractionConfig };
