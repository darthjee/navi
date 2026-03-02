import axios from 'axios';
import { RequestFailed } from '../exceptions/RequestFailed.js';

/**
 * Requester is responsible for performing HTTP requests to a specified URL
 *
 * After the request is performed, it checks if the response
 * status matches the expected status defined in the resourceRequest.
 *
 * @author darthjee
 */
class Requester {
  /**
   * @param {ResourceRequest} resourceRequest Information about the URL to request
   * and the expected status code.
   */
  constructor(resourceRequest) {
    this.resourceRequest = resourceRequest;
  }

  /**
   * Performs the HTTP request and checks the response status.
   * @returns {Promise<boolean>} Returns true if the response status matches the expected status.
   * @throws {RequestFailed} Throws an error if the request fails or the status does not match.
   */
  async perform() {
    try {
      return await this.#request();
    } catch (error) {
      if (error.response) {
        throw new RequestFailed(error.response.status, this.resourceRequest.url);
      }
      throw error;
    }
  }

  /**
   * Performs the HTTP request and checks the response status.
   * @returns {Promise<boolean>} Returns true if the response status matches the expected status.
   * @throws {RequestFailed} Throws an error if the request fails or the status does not match.
   */
  async #request() {
    const response = await axios.get(this.resourceRequest.url);
    if (response.status === this.resourceRequest.status) {
      return true;
    } else {
      throw new RequestFailed(response.status, this.resourceRequest.url);
    }
  }
}

export { Requester };


