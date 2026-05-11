import { RequestHandler } from '../common/server/RequestHandler.js';
import RedirectLocation from '../models/RedirectLocation.js';
import RedirectQueryString from '../models/RedirectQueryString.js';

/**
 * Executes request-handling behavior for redirect routes.
 */
class RedirectHandler extends RequestHandler {
  #request;
  #response;
  #target;
  // Only allow relative hash-routes and RFC3986-safe query characters.
  // This guarantees redirects stay inside the SPA (`/#/...`) and never become absolute URLs.
  #safeRedirectPattern = /^\/#\/[A-Za-z0-9/_-]*(\?[A-Za-z0-9\-._~%!$&'()*+,;=:/?]*)?$/;

  /**
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {string} target
   */
  constructor(request, response, target) {
    super();
    this.#request = request;
    this.#response = response;
    this.#target = target;
  }

  /**
   * Executes the redirect flow and writes the response.
   */
  handle() {
    this.#response.redirect(302, this.#buildSafeRedirectLocation());
  }

  /**
   * Builds the redirect destination including route params and query string.
   * @returns {string}
   */
  #buildRedirectLocation() {
    const location = new RedirectLocation(this.#target, this.#request.params).build();
    const queryString = new RedirectQueryString(this.#request.query).build();
    return queryString === '' ? location : `${location}?${queryString}`;
  }

  /**
   * Builds the final safe redirect destination.
   * @returns {string}
   */
  #buildSafeRedirectLocation() {
    const redirectLocation = this.#buildRedirectLocation();
    return this.#isSafeRedirectLocation(redirectLocation) ? redirectLocation : '/#/';
  }

  /**
   * Checks whether the resolved redirect destination is a safe relative hash route.
   * @param {string} location
   * @returns {boolean}
   */
  #isSafeRedirectLocation(location) {
    return this.#safeRedirectPattern.test(location);
  }
}

export default RedirectHandler;
