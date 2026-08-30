import { JobRegistry as DefaultJobRegistry } from 'deku-swarm';
import { Application } from '../services/application/Application.js';

/**
 * EmitEnqueuer enqueues one EmitJob per extracted item, forwarding the resource
 * request's declared `emit` configuration and the original request parameters.
 * @author darthjee
 */
class EmitEnqueuer {
  #items;
  #emit;
  #parameters;
  #jobRegistry;
  #extractionId;

  /**
   * @param {Array<ExtractedItem>} items List of extracted items, as produced by a parser's `extract()`.
   * @param {ResourceRequestEmit} emit The resource request's declared emit configuration.
   * @param {object} [parameters] Key-value map used to resolve {:placeholder} tokens in the emit URL.
   * @param {object} [jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {number|null} [extractionId=null] The id of the extraction record whose items are being emitted.
   */
  constructor(items, emit, parameters, jobRegistry = DefaultJobRegistry, extractionId = null) {
    this.#items = items;
    this.#emit = emit;
    this.#parameters = parameters;
    this.#jobRegistry = jobRegistry;
    this.#extractionId = extractionId;
  }

  /**
   * Enqueues one EmitJob per extracted item, with the configured emit and parameters.
   * Does nothing if the application is in 'stopped' status.
   * @returns {void}
   */
  enqueue() {
    if (Application.isStopped()) return;
    for (const item of this.#items) {
      this.#jobRegistry.enqueue('Emit', {
        item, emit: this.#emit, parameters: this.#parameters, extractionId: this.#extractionId,
      });
    }
  }
}

export { EmitEnqueuer };
