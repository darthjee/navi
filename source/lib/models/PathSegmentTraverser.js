import { MissingMappingVariable } from '../exceptions/MissingMappingVariable.js';

/**
 * Traverses an object one path segment at a time, throwing when
 * the segment cannot be resolved.
 *
 * @example
 * const traverser = new PathSegmentTraverser(wrapper, 'parsed_body.id');
 * traverser.traverse('parsed_body'); // advances to wrapper.parsed_body
 * traverser.traverse('id');          // advances to wrapper.parsed_body.id
 * traverser.value;                   // → the resolved value
 * @author darthjee
 */
class PathSegmentTraverser {
  #current;
  #pathExpr;

  /**
   * @param {object} root The starting object to traverse.
   * @param {string} pathExpr The full path expression, used in error messages.
   */
  constructor(root, pathExpr) {
    this.#current = root;
    this.#pathExpr = pathExpr;
  }

  /**
   * The current resolved value after all traversals.
   * @returns {*} The current value.
   */
  get value() {
    return this.#current;
  }

  /**
   * Advances one segment along the path.
   * @param {string} segment The property name to access.
   * @returns {void}
   * @throws {MissingMappingVariable} If the segment cannot be resolved.
   */
  traverse(segment) {
    this.#ensureObject();
    this.#ensureKey(segment);

    this.#current = this.#current[segment];
  }

  /**
   * Ensures the current value is a non-null object.
   * @returns {void}
   * @throws {MissingMappingVariable} If the current value is not an object.
   */
  #ensureObject() {
    if (!this.#isTraversable()) {
      throw new MissingMappingVariable(this.#pathExpr);
    }
  }

  /**
   * Checks whether the current value is a non-null object that can be traversed.
   * @returns {boolean} True if the current value is traversable.
   */
  #isTraversable() {
    return this.#current !== null
      && this.#current !== undefined
      && typeof this.#current === 'object';
  }

  /**
   * Ensures the given segment exists on the current object.
   * @param {string} segment The property name to check.
   * @returns {void}
   * @throws {MissingMappingVariable} If the segment is not present.
   */
  #ensureKey(segment) {
    if (!(segment in this.#current)) {
      throw new MissingMappingVariable(this.#pathExpr);
    }
  }
}

export { PathSegmentTraverser };
