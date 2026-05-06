/**
 * Projects a data object (or array of objects) to a defined set of attributes,
 * stripping any fields not in the allowlist.
 */
class Serializer {
  #attributes;

  /**
   * @param {string[]} attributes - List of attribute names to keep in the output.
   */
  constructor(attributes) {
    this.#attributes = attributes;
  }

  /**
   * Projects the given data to the configured attributes.
   * If data is an array, maps each element recursively.
   * @param {Object|Array} data
   * @returns {Object|Array}
   */
  serialize(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.serialize(item));
    }
    return Object.fromEntries(
      this.#attributes.map((attr) => {
        if (!(attr in data)) {
          throw new Error(`Serializer: attribute "${attr}" is not present in the data`);
        }
        return [attr, data[attr]];
      })
    );
  }
}

export default Serializer;
