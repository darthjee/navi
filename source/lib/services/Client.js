import axios from 'axios';
import { RequestFailed } from '../exceptions/RequestFailed.js';

/**
 * Client performs HTTP requests for resource paths using a configured domain.
 *
 * It validates response status against the expected status from the resource request.
 *
 * @author darthjee
 */
class Client {
  /**
   * @param {object} attributes Client attributes.
   * @param {string} attributes.domain Domain used as base URL.
   */
  constructor(attributes) {
    this.domain = attributes.domain;
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

    if (response.status === resourceRequest.status) {
      return true;
    }

    throw new RequestFailed(response.status, requestUrl);
  }

  /**
   * Builds the complete URL by combining domain and resource URL path.
   * @param {string} resourceUrl URL path from the resource request.
   * @returns {string} The full URL.
   */
  #buildUrl(resourceUrl) {
    return `${this.domain}${resourceUrl}`;
  }
}

export { Client };