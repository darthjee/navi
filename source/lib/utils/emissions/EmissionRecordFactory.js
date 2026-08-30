import { EmissionRecord } from './EmissionRecord.js';
import { IncrementalIdGenerator } from '../generators/IncrementalIdGenerator.js';

/**
 * EmissionRecordFactory creates EmissionRecord instances with automatically assigned
 * incremental IDs.
 * @author darthjee
 */
class EmissionRecordFactory {
  #idGenerator;

  /**
   * Creates a new EmissionRecordFactory instance.
   * @param {object} [params={}] - Construction parameters.
   * @param {IncrementalIdGenerator} [params.idGenerator] - The id generator to use.
   */
  constructor({ idGenerator = new IncrementalIdGenerator() } = {}) {
    this.#idGenerator = idGenerator;
  }

  /**
   * Builds a new EmissionRecord with an auto-assigned id.
   * @param {object} params - Emission parameters.
   * @param {string} params.status - The emission status (`success`, `failed` or `dead`).
   * @param {string} params.url - The URL the emission targeted.
   * @param {string} params.method - The HTTP method used for the emission.
   * @param {number|null} [params.httpStatus] - The HTTP response status, when available.
   * @param {string|null} [params.error] - The error message, when the emission failed.
   * @param {string|null} [params.itemRef] - A compact reference to the emitted item.
   * @param {number|null} [params.extractionId] - The id of the extraction record whose items
   * produced this emission, or null when it cannot be traced.
   * @returns {EmissionRecord} The created emission record.
   */
  build({ status, url, method, httpStatus, error, itemRef, extractionId }) {
    const id = this.#idGenerator.generate();
    return new EmissionRecord(id, { status, url, method, httpStatus, error, itemRef, extractionId });
  }
}

export { EmissionRecordFactory };
