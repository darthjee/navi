import { Job } from './Job.js';
import { Logger } from '../utils/Logger.js';

/**
 * ResourceRequestJob is a Job that performs an HTTP request for a ResourceRequest.
 * @author darthjee
 */
class ResourceRequestJob extends Job {
  #resourceRequest;
  #parameters;
  #clients;
  #client;

  /**
   * Creates a new ResourceRequestJob instance.
   * @param {object} params - The parameters for creating a ResourceRequestJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ResourceRequest} params.resourceRequest - The resource request associated with this job.
   * @param {object} params.parameters - Additional parameters for the request.
   * @param {ClientRegistry} params.clients - Clients registry to be used in a request.
   */
  constructor({ id, resourceRequest, parameters, clients }) {
    super({ id });
    this.#resourceRequest = resourceRequest;
    this.#parameters = parameters;
    this.#clients = clients;
  }

  /**
   * Performs the HTTP request for the resource request.
   * @returns {Promise} A promise that resolves with the HTTP response.
   */
  async perform() {
    Logger.info(`Job #${this.id} performing`);
    try {
      this.lastError = undefined;
      const response = await this.#getClient().perform(this.#resourceRequest);
      this.#resourceRequest.executeActions(response.data);
      return response;
    } catch (error) {
      Logger.error(`Job #${this.id} failed: ${error}`);
      this._fail(error);
    }
  }

  /**
   * Gets the client associated with this job's resource request.
   * @returns {Client} The client associated with this job's resource request.
   * @private
   */
  #getClient() {
    if (!this.#client) {
      this.#client = this.#clients.getClient(this.#resourceRequest.clientName);
    }
    return this.#client;
  }
}

export { ResourceRequestJob };
