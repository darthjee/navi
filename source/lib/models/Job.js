import { Logger } from '../utils/Logger.js';

/**
 * Job represents a unit of work to be processed by a Worker.
 * @author darthjee
 */
class Job {
  #resourceRequest;
  #parameters;
  #clients;
  #client;
  #attempts;
  #readyBy;

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

    this.#attempts = 0;
    this.#readyBy = 0;
  }

  /**
   * Performs the job.
   *
   * This method executes the job's resource request using the appropriate client from the clients registry.
   * It returns a promise that resolves with the result of performing the resource request.
   * @returns {Promise} A promise that resolves with the result of performing the job's resource request.
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
   * Returns the timestamp after which the job is eligible for retry.
   * @returns {number} The readyBy timestamp in milliseconds.
   */
  get readyBy() {
    return this.#readyBy;
  }

  /**
   * Sets the cooldown duration in milliseconds after which the job is eligible for retry.
   * Stores the absolute timestamp (Date.now() + ms) internally.
   * @param {number} ms - Cooldown duration in milliseconds. Use a negative value to mark ready immediately.
   */
  applyCooldown(ms) {
    this.#readyBy = Date.now() + ms;
  }

  /**
   * Checks whether the job's cooldown period has elapsed relative to the given time.
   * @param {number} currentTime - The current timestamp in milliseconds.
   * @returns {boolean} True if the job can be retried at the given time.
   */
  isReadyBy(currentTime) {
    return currentTime >= this.#readyBy;
  }

  /**
   * Checks if the job has been exhausted (i.e., has reached the maximum number of attempts).
   * @returns {boolean} True if the job is exhausted, false otherwise.
   */
  exhausted() {
    return this.#attempts >= 3;
  }

  /**
   * Handles a failed job attempt.
   * @param {Error} error - The error that caused the job to fail.
   * @private
   */
  _fail(error) {
    this.#attempts += 1;
    this.lastError = error;
    throw error;
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
