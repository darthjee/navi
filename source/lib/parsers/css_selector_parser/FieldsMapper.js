import { ArrayValueResolver } from './ArrayValueResolver.js';
import { ValueResolver } from './ValueResolver.js';

/**
 * FieldsMapper maps configured output fields from a DOM container.
 * @author darthjee
 */
class FieldsMapper {
  /**
   * @param {object} fields A `{ outputKey: fieldConfig }` mapping. A falsy
   * `fieldConfig` is treated as an empty configuration.
   */
  constructor(fields) {
    this.fields = fields;
  }

  /**
   * Maps every configured field from the given container.
   * @param {HTMLElement} container The DOM container to map fields from.
   * @returns {object} A new object containing every configured output field.
   */
  map(container) {
    return Object.entries(this.fields).reduce((mapped, [outputKey, fieldConfig]) => {
      const config = fieldConfig || {};

      mapped[outputKey] = config.array
        ? new ArrayValueResolver(config).resolve(container)
        : new ValueResolver(config).resolve(container);

      return mapped;
    }, {});
  }
}

export { FieldsMapper };
