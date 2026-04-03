class Serializer {
  constructor(attributes) {
    this._attributes = attributes;
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
      this._attributes.map((attr) => [attr, data[attr]])
    );
  }
}

export default Serializer;
