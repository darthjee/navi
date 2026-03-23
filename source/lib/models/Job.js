/**
 * Job represents a unit of work to be processed by a Worker.
 * @author darthjee
 */
class Job {
  #resourceRequest;
  #parameters;

  /**
   * Creates a new Job instance.
   * @param {object} params - The parameters for creating a Job instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ResourceRequest} params.resourceRequest - The resource request associated with this job.
   * @param {object} params.parameters - Additional parameters for the request.
   */
  constructor({ id, resourceRequest, parameters, clients }) {
    this.id = id;
    this.#resourceRequest = resourceRequest;
    this.#parameters = parameters;
    this.clients = clients;
  }

  perform() {
  }
}

export { Job };
