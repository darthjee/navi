import { PathSegmentTraverser } from './PathSegmentTraverser.js';

/**
 * Resolves dot/bracket-notation path expressions against an object.
 *
 * Supports expressions such as `parsed_body.id`, `headers['page']`,
 * and `parsed_body.nested.key`. Throws when a segment cannot be resolved.
 *
 * @example
 * const resolver = PathResolver.fromExpression('parsed_body.id');
 * resolver.resolve({ parsed_body: { id: 42 }, headers: {} }); // → 42
 *
 * @example
 * const resolver = PathResolver.fromExpression("headers['x-next-page']");
 * resolver.resolve({ parsed_body: {}, headers: { 'x-next-page': '3' } }); // → '3'
 * @author darthjee
 */
class PathResolver {
  /** @type {RegExp} Pattern for parsing path segments. */
  static #SEGMENT_PATTERN = /(?:^|\.)([\w]+)|\['([^']+)'\]|\["([^"]+)"\]/g;

  #segments;
  #pathExpr;

  /**
   * @param {Array<string>} segments The parsed path segments.
   * @param {string} pathExpr The original path expression string.
   * @example
   * const resolver = new PathResolver(['parsed_body', 'id'], 'parsed_body.id');
   * resolver.resolve({ parsed_body: { id: 42 }, headers: {} }); // → 42
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
    const traverser = new PathSegmentTraverser(obj, this.#pathExpr);

    for (const segment of this.#segments) {
      traverser.traverse(segment);
    }

    return traverser.value;
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
    return [...pathExpr.matchAll(PathResolver.#SEGMENT_PATTERN)]
      .map((match) => match[1] ?? match[2] ?? match[3]);
  }
}

export { PathResolver };
