/**
 * Builds a sanitized query string for redirect URLs.
 */
class RedirectQueryString {
  #query;
  // Reject protocol-relative (`//host`) and absolute (`scheme://host`) URL-like values
  // so query params cannot smuggle external redirect targets.
  #unsafeQueryValuePattern = /^(\/\/|[a-z][a-z0-9+.-]*:\/\/)/i;

  /**
   * @param {Object<string, string|string[]|undefined>} query
   */
  constructor(query) {
    this.#query = query;
  }

  /**
   * Builds a normalized query string while rejecting URL-like values.
   * @returns {string}
   */
  build() {
    const queryParams = new URLSearchParams();

    Object.entries(this.#query).forEach(([key, value]) => {
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
   * Checks whether a query value looks like a URL or protocol-relative URL.
   * @param {unknown} value
   * @returns {boolean}
   */
  #isUnsafeQueryValue(value) {
    return this.#unsafeQueryValuePattern.test(`${value}`);
  }
}

export default RedirectQueryString;
