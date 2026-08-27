/**
 * FieldMapper remaps an item's keys according to a `fields` declaration,
 * used by {@link JsonPathParser#extract}.
 * @author darthjee
 */
class FieldMapper {
  /**
   * @param {object} fields A `{ sourceKey: outputKey }` mapping used to build
   * each output item from a matched item's keys.
   */
  constructor(fields) {
    this.fields = fields;
  }

  /**
   * Maps the given item's keys according to this mapper's `fields`.
   * @param {object} item The item to remap.
   * @returns {object} A new object with `outputKey`s mapped from `item`'s `sourceKey`s.
   * A `sourceKey` absent from `item` maps to `undefined`.
   */
  map(item) {
    return Object.entries(this.fields).reduce((mapped, [sourceKey, outputKey]) => {
      mapped[outputKey] = item[sourceKey];

      return mapped;
    }, {});
  }
}

export { FieldMapper };
