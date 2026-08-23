import { Job } from 'deku-swarm';

/**
 * EmitJob is a Job that sends a single extracted item to an external endpoint, as
 * declared by a resource request's `emit` configuration.
 * @author darthjee
 */
class EmitJob extends Job {
  #item;
  #emit;
  #parameters;
  #clients;

  /**
   * Creates a new EmitJob instance.
   * @param {object} params - The parameters for creating an EmitJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ExtractedItem} params.item - The extracted item to send, a single element of a
   * parser's `extract()` output array.
   * @param {ResourceRequestEmit} params.emit - The resource request's declared emit configuration.
   * @param {object} [params.parameters] - Key-value map used to resolve {:placeholder} tokens
   * in the emit URL.
   * @param {NamespaceMap} params.clients - The namespace map used to resolve the client for this emit.
   */
  constructor({ id, item, emit, parameters, clients }) {
    super({ id });
    this.#item = item;
    this.#emit = emit;
    this.#parameters = parameters;
    this.#clients = clients;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * The URL is fully resolved with all parameter placeholders substituted.
   * @returns {{ url: string, method: string }} The job arguments.
   */
  get arguments() {
    return { url: this.#emit.resolveUrl(this.#parameters), method: this.#emit.method };
  }

  /**
   * Emits the extracted item to the configured external endpoint.
   * @param {LogContext} logContext - Context carrying workerId/jobId for log entries.
   * @returns {Promise<object>} A promise that resolves with the HTTP response.
   */
  async perform(logContext) {
    logContext.debug(`EmitJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      const url = this.#emit.resolveUrl(this.#parameters);
      const response = await this.#getClient().emit(this.#emit.method, url, this.#item, this.#emit.status, logContext);
      return response;
    } catch (error) {
      logContext.error(`EmitJob #${this.id} failed: ${error}`);
      this._fail(error);
    }
  }

  /**
   * Gets the client associated with this job's emit configuration.
   * @returns {Client} The client associated with this job's emit configuration.
   * @private
   */
  #getClient() {
    return this.#clients.getClient('default', this.#emit.clientName, this.#emit.clientNamespace);
  }
}

export { EmitJob };
