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
  }

  async perform() {
    return this.#getClient().perform(this.#resourceRequest);
  }

  #getClient() {
    if (!this.#client) {
      this.#client = this.#clients.getClient(this.#resourceRequest.clientName);
    }

    return this.#client;
  }
}

export { Job };
