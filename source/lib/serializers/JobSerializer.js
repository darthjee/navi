import { Serializer } from './Serializer.js';

/**
 * Serializes one or more job instances into plain data objects.
 * @augments Serializer
 */
class JobSerializer extends Serializer {
  /**
   * Serializes a single job instance into a `{ id, status, attempts }` object.
   *
   * @param {object} job - A job instance.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in the serialized object.
   * @returns {{ id: string, status: string, attempts: number }} The serialized job data.
   */
  static _serializeObject(job, { status }) {
    return { id: job.id, status, attempts: job._attempts };
  }
}

export { JobSerializer };

