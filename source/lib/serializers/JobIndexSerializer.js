import { Serializer } from './Serializer.js';

/**
 * Serializes one or more job instances into index-view plain data objects.
 * @augments Serializer
 */
class JobIndexSerializer extends Serializer {
  /**
   * Serializes a single job instance into a `{ id, status, attempts, jobClass }` object.
   *
   * @param {object} job - A job instance.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in the serialized object.
   * @returns {{ id: string, status: string, attempts: number, jobClass: string }} The serialized job data.
   */
  static _serializeObject(job, { status }) {
    return {
      id: job.id,
      status,
      attempts: job._attempts,
      jobClass: job.constructor.name,
    };
  }
}

export { JobIndexSerializer };
