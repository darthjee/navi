/**
 * Converts an Express route pattern and its resolved params into the
 * ordered steps array expected by {@link DataNavigator}.
 */
class RouteParamsExtractor {
  #route;
  #params;

  /**
   * @param {string} route - Express route pattern (e.g. `/categories/:id.json`).
   * @param {Object<string, string>} params - Resolved route params from `req.params`.
   * @throws {Error} If `route` is not a string starting with `/`.
   */
  constructor(route, params) {
    if (typeof route !== 'string' || !route.startsWith('/')) {
      throw new Error(`RouteParamsExtractor: invalid route pattern "${route}" — must start with "/"`);
    }
    this.#route = route;
    this.#params = params;
  }

  /**
   * Builds the DataNavigator steps array from the route pattern and params.
   * @returns {Array<string|number>}
   */
  steps() {
    return this.#route
      .replace(/\.json$/, '')
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        if (segment.startsWith(':')) {
          const paramName = segment.slice(1);
          if (!paramName) {
            throw new Error(`RouteParamsExtractor: empty parameter name in route "${this.#route}"`);
          }
          const numValue = Number(this.#params[paramName]);
          if (isNaN(numValue)) {
            throw new Error(`Invalid numeric parameter "${paramName}": ${this.#params[paramName]}`);
          }
          return numValue;
        }
        return segment;
      });
  }
}

export default RouteParamsExtractor;
