/**
 * Handles an incoming Express request by issuing an HTTP 302 redirect to
 * the hash-based equivalent path, substituting any route parameters into
 * the target template.
 */
class RedirectHandler {
  #target;

  /**
   * @param {string} target - Hash-based redirect target template (e.g. '/#/categories/:id').
   *   Named segments (`:param`) are replaced with the corresponding values from `req.params`.
   */
  constructor(target) {
    this.#target = target;
  }

  /**
   * Substitutes route params into the target template and redirects with 302.
   * Each param value is URI-encoded to prevent injection into the redirect URL.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    const location = this.#target.replace(/:([^/]+)/g, (_match, name) => {
      const value = req.params[name];
      return value !== undefined ? encodeURIComponent(value) : `:${name}`;
    });
    res.redirect(302, location);
  }
}

export default RedirectHandler;
