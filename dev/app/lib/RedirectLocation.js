/**
 * Builds a redirect location URL by substituting route parameter values into a
 * hash-based target template (e.g. `'/#/categories/:id'`).
 *
 * Each parameter value is URI-encoded to prevent injection into the redirect URL.
 */
class RedirectLocation {
  #target;
  #params;

  /**
   * @param {string} target - Hash-based target template (e.g. `'/#/categories/:id'`).
   * @param {Object} params - Route params object (e.g. `req.params`).
   */
  constructor(target, params) {
    this.#target = target;
    this.#params = params;
  }

  /**
   * Returns the resolved redirect location with all named segments replaced.
   * @returns {string}
   */
  build() {
    return this.#target.replace(/:([^/]+)/g, (_match, name) => {
      const value = this.#params[name];
      return value !== undefined ? encodeURIComponent(value) : `:${name}`;
    });
  }
}

export default RedirectLocation;
