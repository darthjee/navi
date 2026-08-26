/**
 * Represents a single memory reading with id, value, percentage and timestamp.
 * @author darthjee
 */
class MemoryData {
  #id;
  #value;
  #percentage;
  #timestamp;

  /**
   * Creates a new MemoryData instance.
   * @param {number} id - Unique incremental identifier for this reading.
   * @param {number} value - The raw RSS reading, in bytes.
   * @param {number} percentage - `value` as a percentage of the configured memory maximum.
   */
  constructor(id, value, percentage) {
    this.#id = id;
    this.#value = value;
    this.#percentage = percentage;
    this.#timestamp = new Date();
  }

  /**
   * Gets the entry ID.
   * @returns {number} The entry ID.
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets the raw memory value, in bytes.
   * @returns {number} The memory value.
   */
  get value() {
    return this.#value;
  }

  /**
   * Gets the memory percentage.
   * @returns {number} The memory percentage.
   */
  get percentage() {
    return this.#percentage;
  }

  /**
   * Gets the entry timestamp.
   * @returns {Date} The timestamp when the entry was created.
   */
  get timestamp() {
    return this.#timestamp;
  }

  /**
   * Converts the entry to a plain object.
   * @returns {object} Plain object representation of the entry.
   */
  toJSON() {
    return {
      id: this.#id,
      value: this.#value,
      percentage: this.#percentage,
      timestamp: this.#timestamp.toISOString()
    };
  }
}

export { MemoryData };
