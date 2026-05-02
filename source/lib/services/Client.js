import axios from 'axios';
import { RequestFailed } from '../exceptions/RequestFailed.js';
import { LogRegistry } from '../registry/LogRegistry.js';

/**
 * Client performs HTTP requests for resource paths using a configured base URL.
 *
 * It validates response status against the expected status from the resource request.
 *
 * @author darthjee
 */
class Client {
  /**
   * @param {object} attributes Client attributes.
   * @param {string} attributes.name Name identifying this client.
   * @param {string} attributes.baseUrl Base URL used to build full request URLs.
   * @param {number} [attributes.timeout] Optional request timeout in milliseconds.
   * @param {object} [attributes.headers] Optional HTTP headers sent with every request.
   */
  constructor({ name, baseUrl, timeout = 5000, headers = {} }) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.headers = headers;
  }

  /**
   * Creates a Client instance from a plain configuration object.
   *
   * @param {string} name The name identifying the client.
   * @param {object} config Client configuration object.
   * @param {string} config.base_url Base URL for the client.
   * @param {number} [config.timeout] Optional request timeout in milliseconds.
   * @param {object} [config.headers] Optional HTTP headers.
   * @returns {Client} A new Client instance.
   */
  static fromObject(name, config) {
    const headers = config.headers || {};
    const baseUrl = config.base_url;
    return new Client({ name, baseUrl, timeout: config.timeout, headers });
  }

  /**
   * Creates an array of Client instances from a map of client configurations.
   *
   * @param {object} object Map of client names to client configuration objects.
   * @returns {Array<Client>} List of Client instances.
   */
  static fromListObject(object) {
    return Object.entries(object).map(([name, config]) => Client.fromObject(name, config));
  }

  /**
   * Performs the HTTP request and checks the response status.
   * @param {ResourceRequest} resourceRequest Information about the URL path to request
   * and the expected status code.
   * @param {object} [parameters={}] Key-value map used to resolve {:placeholder} tokens in the URL.
   * @returns {Promise<boolean>} Returns true if the response status matches the expected status.
   * @throws {RequestFailed} Throws an error if the request fails or the status does not match.
   */
  async perform(resourceRequest, parameters = {}) {
    const requestUrl = this.#buildUrl(resourceRequest.resolveUrl(parameters));
    LogRegistry.info(`[Client:${this.name}] Requesting ${requestUrl}`);
    try {
      return await this.#request(resourceRequest, requestUrl);
    } catch (error) {
      this.#handleError(error, requestUrl);
    }
  }

  /**
   * Performs an HTTP request to the given fully-resolved URL and validates the expected status.
   * Unlike `perform`, this method accepts an absolute URL directly and does not prepend `baseUrl`.
   * @param {string} absoluteUrl The fully-resolved URL to request.
   * @param {number} expectedStatus The expected HTTP response status code.
   * @returns {Promise<object>} The Axios response object.
   * @throws {RequestFailed} If the response status does not match `expectedStatus`.
   */
  async performUrl(absoluteUrl, expectedStatus) {
    LogRegistry.info(`[Client:${this.name}] Requesting ${absoluteUrl}`);
    try {
      return await this.#requestUrl(absoluteUrl, expectedStatus);
    } catch (error) {
      this.#handleError(error, absoluteUrl);
    }
  }

  /**
   * Performs the HTTP request and checks the response status.
   * @param {ResourceRequest} resourceRequest Information about the URL path to request
   * and the expected status code.
   * @param {string} requestUrl The full URL for the request.
   * @returns {Promise<boolean>} Returns true if the response status matches the expected status.
   * @throws {RequestFailed} Throws an error if the response status does not match.
   */
  async #request(resourceRequest, requestUrl) {
    return this.#requestUrl(requestUrl, resourceRequest.status);
  }

  /**
   * Performs the HTTP GET request to the given URL and validates the response status.
   * @param {string} requestUrl The full URL to request.
   * @param {number} expectedStatus The expected HTTP response status code.
   * @returns {Promise<object>} The Axios response object.
   * @throws {RequestFailed} Throws an error if the response status does not match.
   */
  async #requestUrl(requestUrl, expectedStatus) {
    const response = await axios.get(requestUrl, {
      timeout: this.timeout,
      responseType: 'text',
      headers: this.headers,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    LogRegistry.info(`[Client:${this.name}] Response ${requestUrl} → ${response.status}`);

    if (response.status !== expectedStatus) {
      LogRegistry.info(`[Client:${this.name}] ${requestUrl} did not match (got ${response.status}, expected ${expectedStatus})`);
      throw new RequestFailed(response.status, requestUrl);
    }

    LogRegistry.info(`[Client:${this.name}] ${requestUrl} matched (expected ${expectedStatus})`);
    return response;
  }

  /**
   * Handles a caught request error, logging it and re-throwing as RequestFailed when applicable.
   * @param {Error} error The caught error.
   * @param {string} requestUrl The URL that was requested.
   * @throws {RequestFailed} If the error has a response object.
   * @throws {Error} Re-throws the original error otherwise.
   */
  #handleError(error, requestUrl) {
    LogRegistry.error(`Request failed: ${error}`);
    if (error.response) {
      throw new RequestFailed(error.response.status, requestUrl);
    }
    throw error;
  }

  /**
   * Builds the complete URL by combining base URL and resource URL path.
   * @param {string} resourceUrl URL path from the resource request.
   * @returns {string} The full URL.
   */
  #buildUrl(resourceUrl) {
    return `${this.baseUrl}${resourceUrl}`;
  }
}

export { Client };