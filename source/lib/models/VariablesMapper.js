import { MissingMappingVariable } from '../exceptions/MissingMappingVariable.js';

/**
 * Applies a variables_map to a response item, renaming fields as configured.
 *
 * When variables_map is empty, the item is returned as-is.
 * When variables_map has entries, only the mapped fields are included in the result.
 * @author darthjee
 */
class VariablesMapper {
  #variablesMap;

  /**
   * @param {object} [variablesMap={}] Key-value map where each key is a source field
   * in the response item and its value is the destination variable name.
   */
  constructor(variablesMap = {}) {
    this.#variablesMap = variablesMap;
  }

  /**
   * Applies the variables_map to the given item.
   * @param {object} item A single response item.
   * @returns {object} The transformed variables object.
   * @throws {MissingMappingVariable} If a source field referenced in the map is absent from the item.
   */
  map(item) {
    const entries = Object.entries(this.#variablesMap);
    if (entries.length === 0) return item;

    return Object.fromEntries(entries.map(([src, dest]) => {
      if (!(src in item)) throw new MissingMappingVariable(src);
      return [dest, item[src]];
    }));
  }
}

export { VariablesMapper };
