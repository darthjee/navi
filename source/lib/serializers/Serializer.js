/**
 * Abstract base class for serializers.
 * Subclasses must implement the `_serializeObject` static method.
 */
class Serializer {
  /**
   * Serializes an item or a list of items using `_serializeObject`.
   *
   * When `itemOrList` is an array, each element is serialized individually.
   * When it is a single object, delegates to `_serializeObject`.
   *
   * @param {object|object[]} itemOrList - A single item or array of items.
   * @param {object} options - Options forwarded to `_serializeObject`.
   * @returns {object|object[]} The serialized item, or an array of serialized items.
   */
  static serialize(itemOrList, options) {
    if (Array.isArray(itemOrList)) {
      return itemOrList.map(item => this.serialize(item, options));
    }
    return this._serializeObject(itemOrList, options);
  }

  /**
   * Serializes a single item into a plain object.
   * Must be overridden by subclasses.
   * @param {object} _item - The item to serialize.
   * @param {object} _options - Serialization options.
   * @throws {Error} Always throws — subclasses must implement this method.
   * @returns {object} The serialized plain object.
   */
  static _serializeObject(_item, _options) {
    throw new Error('Subclasses must implement _serializeObject');
  }
}

export { Serializer };
