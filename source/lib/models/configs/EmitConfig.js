/**
 * Represents the top-level emission-tracking configuration for the application.
 *
 * This `emit:` key is a sibling of `resources` / `web` / `log` and is distinct from the
 * per-resource `resources.*.emit` block: it only carries the retention limit for the
 * emission-tracking store.
 * @author darthjee
 */
class EmitConfig {
  #size;

  /**
   * Creates an instance of EmitConfig.
   * @param {object} [config={}] - The configuration object.
   * @param {number} [config.size=100] - The maximum number of emission records to retain.
   */
  constructor({ size = 100 } = {}) {
    this.#size = size;
  }

  /**
   * Gets the maximum number of emission records to retain.
   * @returns {number} The emission store size.
   */
  get size() {
    return this.#size;
  }

  /**
   * Creates an EmitConfig instance from a raw YAML object.
   * @param {object|null|undefined} obj - The raw emit config object from YAML.
   * @returns {EmitConfig} A new EmitConfig instance.
   */
  static fromObject(obj) {
    return new EmitConfig(obj ?? {});
  }
}

export { EmitConfig };
