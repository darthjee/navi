import { Serializer } from './Serializer.js';

/**
 * Serializes one or more job instances into index-view plain data objects.
 * @augments Serializer
 */
class JobIndexSerializer extends Serializer {
  /**
   * Serializes a single job instance into a `{ id, status, attempts, jobClass[, url] }` object.
   * For `ResourceRequestJob` instances, the resolved URL is included as `url`.
   *
   * @param {object} job - A job instance.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in the serialized object.
   * @returns {{ id: string, status: string, attempts: number, jobClass: string, url?: string }} The serialized job data.
   */
  static _serializeObject(job, { status }) {
    const result = {
      id: job.id,
      status,
      attempts: job._attempts,
      jobClass: job.constructor.name,
    };

    if (job.constructor.name === 'ResourceRequestJob') {
      result.url = job.arguments?.url;
    }

    return result;
  }
}

export { JobIndexSerializer };
