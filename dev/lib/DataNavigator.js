/**
 * Traverses a nested data structure by following a sequence of steps.
 * Numeric steps perform an Array#find by `id`; string steps access an object key.
 */
class DataNavigator {
  /**
   * @param {Object|Array} data - Root data structure to navigate.
   * @param {Array<string|number>} steps - Ordered navigation steps.
   */
  constructor(data, steps) {
    this._data = data;
    this._steps = steps;
  }

  /**
   * Walks the data structure following `steps` and returns the reached value,
   * or `null` if any intermediate step yields nothing.
   * @returns {*}
   */
  navigate() {
    let current = this._data;

    for (const step of this._steps) {
      if (current === null || current === undefined) return null;

      if (typeof step === 'number') {
        current = current.find((item) => item.id === step);
      } else {
        current = current[step];
      }
    }

    return current ?? null;
  }
}

export default DataNavigator;
