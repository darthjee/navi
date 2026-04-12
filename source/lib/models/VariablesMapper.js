import { MissingMappingVariable } from '../exceptions/MissingMappingVariable.js';

/**
 * Applies a parameters map to a ResponseWrapper, resolving path expressions
 * against the wrapper to extract values from the parsed body or headers.
 *
 * When the parameters map is empty, the parsed body of the response item
 * is returned as-is.
 * When the parameters map has entries, each value is a path expression
 * (e.g. `parsed_body.id`, `headers['page']`) resolved against the wrapper.
 * @author darthjee
 */
class VariablesMapper {
  #parametersMap;

  /**
   * @param {object} [parametersMap={}] Key-value map where each key is the
   * destination variable name and its value is a path expression to resolve
   * against the ResponseWrapper (e.g. `parsed_body.id`, `headers['page']`).
   */
  constructor(parametersMap = {}) {
    this.#parametersMap = parametersMap;
  }

  /**
   * Applies the parameters map to the given ResponseWrapper item.
   * @param {object} item A ResponseWrapper or plain object exposing the
   * properties referenced by the path expressions.
   * @returns {object} The transformed variables object.
   * @throws {MissingMappingVariable} If a path expression cannot be resolved.
   */
  map(item) {
    const entries = Object.entries(this.#parametersMap);
    if (entries.length === 0) return item;

    return Object.fromEntries(entries.map(([dest, pathExpr]) => {
      const value = this.#resolvePath(item, pathExpr);
      return [dest, value];
    }));
  }

  /**
   * Resolves a dot/bracket-notation path expression against an object.
   * Supports `parsed_body.id`, `headers['page']`, `parsed_body.nested.key`.
   * @param {object} obj The object to resolve against.
   * @param {string} pathExpr The path expression string.
   * @returns {*} The resolved value.
   * @throws {MissingMappingVariable} If any segment of the path is missing.
   */
  #resolvePath(obj, pathExpr) {
    const segments = this.#parsePathSegments(pathExpr);
    let current = obj;

    for (const segment of segments) {
      if (current === null || current === undefined || !(segment in Object(current))) {
        throw new MissingMappingVariable(pathExpr);
      }
      current = current[segment];
    }

    return current;
  }

  /**
   * Parses a path expression string into an array of property segments.
   * Handles dot notation and bracket notation with single or double quotes.
   * @param {string} pathExpr The path expression (e.g. `parsed_body.id`, `headers['page']`).
   * @returns {Array<string>} The array of path segments.
   */
  #parsePathSegments(pathExpr) {
    const segments = [];
    const regex = /(?:^|\.)([\w]+)|\['([^']+)'\]|\["([^"]+)"\]/g;
    let match;

    while ((match = regex.exec(pathExpr)) !== null) {
      segments.push(match[1] ?? match[2] ?? match[3]);
    }

    return segments;
  }
}

export { VariablesMapper };
