import { PathResolver } from './PathResolver.js';

/**
 * Applies a parameters map to a ResponseWrapper, resolving path expressions
 * against the wrapper to extract values from the parsed body or headers.
 *
 * When the parameters map is empty, the originating request parameters of the response
 * item are returned (or an empty object if none exist).
 * When the parameters map has entries, each value is a path expression
 * (e.g. `parsedBody.id`, `headers['page']`) resolved against the wrapper.
 * @author darthjee
 */
class ParametersMapper {
  #resolvers;

  /**
   * @param {object} [parametersMap={}] Key-value map where each key is the
   * destination variable name and its value is a path expression to resolve
   * against the ResponseWrapper (e.g. `parsedBody.id`, `headers['page']`).
   */
  constructor(parametersMap = {}) {
    this.#resolvers = Object.entries(parametersMap).map(
      ([dest, pathExpr]) => [dest, PathResolver.fromExpression(pathExpr)]
    );
  }

  /**
   * Applies the parameters map to the given ResponseWrapper item.
   * @param {object} item A ResponseWrapper or plain object exposing the
   * properties referenced by the path expressions.
   * @returns {object} The transformed variables object.
   * @throws {MissingMappingVariable} If a path expression cannot be resolved.
   */
  map(item) {
    if (this.#resolvers.length === 0) return item.parameters ?? {};

    return Object.fromEntries(this.#resolvers.map(([dest, resolver]) => {
      return [dest, resolver.resolve(item)];
    }));
  }
}

export { ParametersMapper };
