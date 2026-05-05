const DEFAULT_PAGE_SIZE = 5;

/**
 * Holds the `json` section of the dev app configuration.
 * Exposes a `pageSize` property with a sensible default.
 * Expects values to already have environment variable references resolved.
 */
class JsonConfig {
  #pageSize;

  /**
   * @param {object} [raw={}] Raw `json` section from the config file (already env-resolved).
   * @param {string|number} [raw.pageSize] Default page size for collection endpoints.
   */
  constructor(raw = {}) {
    const parsed = parseInt(raw.pageSize, 10);
    this.#pageSize = (Number.isNaN(parsed) || parsed <= 0) ? DEFAULT_PAGE_SIZE : parsed;
  }

  /**
   * Returns the configured default page size.
   * @returns {number}
   */
  get pageSize() {
    return this.#pageSize;
  }
}

export { JsonConfig };
