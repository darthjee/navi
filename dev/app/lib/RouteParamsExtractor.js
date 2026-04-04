/**
 * Converts an Express route pattern and its resolved params into the
 * ordered steps array expected by {@link DataNavigator}.
 */
class RouteParamsExtractor {
  /**
   * @param {string} route - Express route pattern (e.g. `/categories/:id.json`).
   * @param {Object<string, string>} params - Resolved route params from `req.params`.
   */
  constructor(route, params) {
    this._route = route;
    this._params = params;
  }

  /**
   * Builds the DataNavigator steps array from the route pattern and params.
   * @returns {Array<string|number>}
   */
  steps() {
    return this._route
      .replace(/\.json$/, '')
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        if (segment.startsWith(':')) {
          return Number(this._params[segment.slice(1)]);
        }
        return segment;
      });
  }
}

export default RouteParamsExtractor;
