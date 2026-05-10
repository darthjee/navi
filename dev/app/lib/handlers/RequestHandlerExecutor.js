import RedirectLocation from '../models/RedirectLocation.js';

/**
 * Executes request-handling behavior for redirect routes.
 */
class RequestHandlerExecutor {
  #request;
  #response;
  #target;
  // Only allow relative hash-routes and RFC3986-safe query characters.
  // This guarantees redirects stay inside the SPA (`/#/...`) and never become absolute URLs.
  #safeRedirectPattern = /^\/#\/[A-Za-z0-9/_-]*(\?[A-Za-z0-9\-._~%!$&'()*+,;=:/?]*)?$/;
  // Reject protocol-relative (`//host`) and absolute (`scheme://host`) URL-like values
  // so query params cannot smuggle external redirect targets.
  #unsafeQueryValuePattern = /^(\/\/|[a-z][a-z0-9+.-]*:\/\/)/i;

  /**
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {string} target
   */
  constructor(request, response, target) {
    this.#request = request;
    this.#response = response;
    this.#target = target;
  }

  /**
   * Executes the redirect flow and writes the response.
   */
  handle() {
    const location = new RedirectLocation(this.#target, this.#request.params).build();
    const queryString = this.#buildQueryString(this.#request.query);
    const redirectLocation = queryString === '' ? location : `${location}?${queryString}`;
    const safeRedirectLocation = this.#isSafeRedirectLocation(redirectLocation)
      ? redirectLocation
      : '/#/';

    this.#response.redirect(302, safeRedirectLocation);
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

  /**
   * Checks whether a query value looks like a URL or protocol-relative URL.
   * @param {unknown} value
   * @returns {boolean}
   */
  #isUnsafeQueryValue(value) {
    return this.#unsafeQueryValuePattern.test(`${value}`);
  }
}

export default RequestHandlerExecutor;
