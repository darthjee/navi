import axios from 'axios';
import { RequestFailed } from '../exceptions/RequestFailed.js';
import { EnvResolver } from '../utils/EnvResolver.js';
import { Logger } from '../utils/logging/Logger.js';

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
   * @param {object} [config.headers] Optional HTTP headers. Values matching
   *   `$VAR` or `${VAR}` are resolved from `process.env` at parse time.
   * @returns {Client} A new Client instance.
   */
  static fromObject(name, config) {
    const headers = EnvResolver.resolveObject(config.headers || {});
    return new Client({ name, baseUrl: config.base_url, timeout: config.timeout, headers });
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
   * @returns {Promise<boolean>} Returns true if the response status matches the expected status.
   * @throws {RequestFailed} Throws an error if the request fails or the status does not match.
   */
  async perform(resourceRequest) {
    const requestUrl = this.#buildUrl(resourceRequest.url);
    Logger.info(`[Client:${this.name}] Requesting ${requestUrl}`);
    try {
      return await this.#request(resourceRequest, requestUrl);
    } catch (error) {
      Logger.error(`Request failed: ${error}`);
      if (error.response) {
        throw new RequestFailed(error.response.status, requestUrl);
      }
      throw error;
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
    const response = await axios.get(requestUrl, {
      timeout: this.timeout,
      responseType: 'text',
      headers: this.headers,
    });

    if (response.status !== resourceRequest.status) {
      throw new RequestFailed(response.status, requestUrl);
    }

    return response;
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