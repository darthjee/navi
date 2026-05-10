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
  #unsafeQueryValuePattern = /^(\/\/|[a-z][a-z0-9+.-]*:\/\/)/i;

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

  /**
   * Builds a normalized query string from request query params while rejecting
   * potentially unsafe URL-like values.
   * @param {Object<string, string|string[]|undefined>} query
   * @returns {string}
   */
  #buildQueryString(query) {
    const queryParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (!this.#isUnsafeQueryValue(item)) {
            queryParams.append(key, item);
          }
        });
        return;
      }

      if (value !== undefined && !this.#isUnsafeQueryValue(value)) {
        queryParams.append(key, value);
      }
    });

    return queryParams.toString();
  }

  /**
   * Checks whether the resolved redirect destination is a safe relative hash route.
   * @param {string} location
   * @returns {boolean}
   */
  #isSafeRedirectLocation(location) {
    return this.#safeRedirectPattern.test(location);
  }

  #isUnsafeQueryValue(value) {
    return this.#unsafeQueryValuePattern.test(`${value}`);
  }
}

export default RedirectHandler;
