/**
 * Wraps the raw `web.memory.maximum` value coming from YAML config, exposing it
 * through the common reader contract (`read()`) shared with the other memory
 * limit readers consumed by {@link MemoryMaximumResolver}.
 * @author darthjee
 */
class ConfigMemoryLimitReader {
  #maximum;

  /**
   * @param {number} [maximum] - The raw `web.memory.maximum` value from config.
   */
  constructor(maximum) {
    this.#maximum = maximum;
  }

  /**
   * @returns {number|null} The configured maximum, or `null` when it was not set.
   */
  read() {
    return this.#maximum ?? null;
  }
}

export { ConfigMemoryLimitReader };
