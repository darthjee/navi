/**
 * Job represents a unit of work to be processed by a Worker.
 * @author darthjee
 */
class Job {
  #resourceRequest;
  #parameters;
  #clients;
  #client;

  /**
   * Creates a new Job instance.
   * @param {object} params - The parameters for creating a Job instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ResourceRequest} params.resourceRequest - The resource request associated with this job.
   * @param {object} params.parameters - Additional parameters for the request.
   * @param {ClientRegistry} params.clients - Clients registry to be used in a request
   */
  constructor({ id, resourceRequest, parameters, clients }) {
    this.id = id;
    this.#resourceRequest = resourceRequest;
    this.#parameters = parameters;
    this.#clients = clients;

    this.attempts = 0;
  }

  /**
   * Performs the job.
   *
   * This method executes the job's resource request using the appropriate client from the clients registry.
   * It returns a promise that resolves with the result of performing the resource request.
   * @returns {Promise} A promise that resolves with the result of performing the job's resource request.
   */
  async perform() {
    try {
      this.lastError = undefined;
      this.attempts += 1;
      return await this.#getClient().perform(this.#resourceRequest);
    } catch (error) {
      this.lastError = error;
      throw error;
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

export { Job };
