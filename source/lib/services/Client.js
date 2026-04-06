import axios from 'axios';
import { RequestFailed } from '../exceptions/RequestFailed.js';
import { Logger } from '../utils/Logger.js';

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
   */
  constructor({ name, baseUrl }) {
    this.name = name;
    this.baseUrl = baseUrl;
  }

  /**
   * Creates a Client instance from a plain configuration object.
   *
   * @param {string} name The name identifying the client.
   * @param {object} config Client configuration object.
   * @param {string} config.base_url Base URL for the client.
   * @returns {Client} A new Client instance.
   */
  static fromObject(name, config) {
    return new Client({ name, baseUrl: config.base_url });
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
    try {
      return await this.#request(resourceRequest);
    } catch (error) {
      Logger.error(`Request failed: ${error}`);
      if (error.response) {
        throw new RequestFailed(error.response.status, this.#buildUrl(resourceRequest.url));
      }
      throw error;
    }
  }

  /**
   * Performs the HTTP request and checks the response status.
   * @param {ResourceRequest} resourceRequest Information about the URL path to request
   * and the expected status code.
   * @returns {Promise<boolean>} Returns true if the response status matches the expected status.
   * @throws {RequestFailed} Throws an error if the response status does not match.
   */
  async #request(resourceRequest) {
    const requestUrl = this.#buildUrl(resourceRequest.url);
    const response = await axios.get(requestUrl);

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