import { MissingMappingVariable } from '../exceptions/MissingMappingVariable.js';

/**
 * Resolves dot/bracket-notation path expressions against an object.
 *
 * Supports expressions such as `parsed_body.id`, `headers['page']`,
 * and `parsed_body.nested.key`. Throws when a segment cannot be resolved.
 * @author darthjee
 */
class PathResolver {
  #segments;
  #pathExpr;

  /**
   * @param {Array<string>} segments The parsed path segments.
   * @param {string} pathExpr The original path expression string.
   */
  constructor(segments, pathExpr) {
    this.#segments = segments;
    this.#pathExpr = pathExpr;
  }

  /**
   * Resolves the path against the given object.
   * @param {object} obj The object to resolve against.
   * @returns {*} The resolved value.
   * @throws {MissingMappingVariable} If any segment of the path is missing.
   */
  resolve(obj) {
    let current = obj;

    for (const segment of this.#segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        throw new MissingMappingVariable(this.#pathExpr);
      }

      if (!(segment in current)) {
        throw new MissingMappingVariable(this.#pathExpr);
      }

      current = current[segment];
    }

    return current;
  }

  /**
   * Creates a PathResolver by parsing a path expression string.
   * @param {string} pathExpr The path expression
   * (e.g. `parsed_body.id`, `headers['page']`).
   * @returns {PathResolver} A new PathResolver instance.
   */
  static fromExpression(pathExpr) {
    const segments = PathResolver.#parsePathSegments(pathExpr);
    return new PathResolver(segments, pathExpr);
  }

  /**
   * Parses a path expression string into an array of property segments.
   * Handles dot notation and bracket notation with single or double quotes.
   * @param {string} pathExpr The path expression
   * (e.g. `parsed_body.id`, `headers['page']`).
   * @returns {Array<string>} The array of path segments.
   */
  static #parsePathSegments(pathExpr) {
    const segments = [];
    const regex = /(?:^|\.)([\w]+)|\['([^']+)'\]|\["([^"]+)"\]/g;
    let match;

    while ((match = regex.exec(pathExpr)) !== null) {
      segments.push(match[1] ?? match[2] ?? match[3]);
    }

    return segments;
  }
}

export { PathResolver };
