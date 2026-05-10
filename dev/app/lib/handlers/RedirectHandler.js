import RequestHandler from './RequestHandler.js';
import RedirectLocation from '../models/RedirectLocation.js';

/**
 * Handles an incoming Express request by issuing an HTTP 302 redirect to
 * the hash-based equivalent path, substituting any route parameters into
 * the target template.
 *
 * Extends {@link RequestHandler} to share the unified handler API.
 */
class RedirectHandler extends RequestHandler {
  #target;
  #safeRedirectPattern = /^\/#\/[A-Za-z0-9/_-]*(\?[A-Za-z0-9\-._~%!$&'()*+,;=:/?]*)?$/;

  /**
   * @param {string} target - Hash-based redirect target template (e.g. '/#/categories/:id').
   *   Named segments (`:param`) are replaced with the corresponding values from `req.params`.
   */
  constructor(target) {
    super();
    this.#target = target;
  }

  /**
   * Builds the redirect location and responds with 302.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    const location = new RedirectLocation(this.#target, req.params).build();
    const queryString = this.#buildQueryString(req.query);
    const redirectLocation = queryString === '' ? location : `${location}?${queryString}`;
    const safeRedirectLocation = this.#isSafeRedirectLocation(redirectLocation)
      ? redirectLocation
      : '/#/';

    res.redirect(302, safeRedirectLocation);
  }

  #buildQueryString(query) {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          queryParams.append(key, item);
        });
        return;
      }

      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });

    return queryParams.toString();
  }

  #isSafeRedirectLocation(location) {
    return this.#safeRedirectPattern.test(location);
  }
}

export default RedirectHandler;
