import { ResponseParser } from './ResponseParser.js';

/**
 * Wraps an HTTP response object, providing convenient access to the
 * parsed JSON body and response headers for use in parameter mapping.
 *
 * Can represent either a full response or a per-item view where
 * `parsedBody` is a single element from the response array.
 * @author darthjee
 */
class ResponseWrapper {
  #response;
  #parsedBody;
  #headers;
  #parameters;

  /**
   * @param {object} response The raw HTTP response object (e.g. from axios).
   * @param {string} response.data The raw response body string.
   * @param {object} response.headers The response headers map.
   * @param {object} [parameters={}] The parameters used in the originating request.
   */
  constructor(response, parameters = {}) {
    this.#response = response;
    this.#headers = response.headers;
    this.#parameters = parameters;
  }

  /**
   * Returns the lazily-parsed JSON body of the response.
   * The result is cached after the first call.
   * @returns {*} The parsed response body.
   */
  get parsedBody() {
    if (this.#parsedBody === undefined) {
      this.#parsedBody = new ResponseParser(this.#response.data).parse();
    }

    return this.#parsedBody;
  }

  /**
   * Returns the response headers map.
   * @returns {object} The raw headers from the HTTP response.
   */
  get headers() {
    return this.#headers;
  }

  /**
   * Returns the parameters of the originating request.
   * @returns {object} The request parameters.
   */
  get parameters() {
    return this.#parameters;
  }

  /**
   * Returns an array of per-item ResponseWrapper instances.
   * If the parsed body is an array, one wrapper is created per element.
   * If it is a single object, a single-element array is returned.
   * Each per-item wrapper shares the same headers as this wrapper.
   * @returns {Array<ResponseWrapper>} List of per-item wrappers.
   */
  toItemWrappers() {
    const body = this.parsedBody;
    const items = Array.isArray(body) ? body : [body];

    return items.map((item) => ResponseWrapper.#fromItem(item, this.#headers, this.#parameters));
  }

  /**
   * Creates a per-item ResponseWrapper with a pre-parsed body, shared headers and parameters.
   * @param {*} parsedBody The already-parsed item value.
   * @param {object} headers The response headers to share.
   * @param {object} parameters The request parameters to share.
   * @returns {ResponseWrapper} A wrapper whose parsedBody is the given item.
   */
  static #fromItem(parsedBody, headers, parameters) {
    const wrapper = new ResponseWrapper({ data: null, headers }, parameters);
    wrapper.#parsedBody = parsedBody;
    return wrapper;
  }
}

export { ResponseWrapper };
