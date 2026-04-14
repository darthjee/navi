/**
 * Traverses a nested data structure by following a sequence of steps.
 * Numeric steps perform an Array#find by `id`; string steps access an object key.
 */
class DataNavigator {
  #data;
  #steps;
  #idField;

  /**
   * @param {Object|Array} data - Root data structure to navigate.
   * @param {Array<string|number>} steps - Ordered navigation steps.
   * @param {string} [idField='id'] - The field name used to match numeric steps against array items.
   */
  constructor(data, steps, idField = 'id') {
    this.#data = data;
    this.#steps = steps;
    this.#idField = idField;
  }

  /**
   * Walks the data structure following `steps` and returns the reached value,
   * or `null` if any intermediate step yields nothing.
   * @returns {*}
   */
  navigate() {
    let current = this.#data;

    for (const step of this.#steps) {
      if (current === null || current === undefined) return null;

      if (typeof step === 'number') {
        current = current.find((item) => item[this.#idField] === step);
      } else {
        current = current[step];
      }
    }

    return current ?? null;
  }
}

export default DataNavigator;
