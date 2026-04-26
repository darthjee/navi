import { Serializer } from './Serializer.js';

/**
 * Serializes one or more job instances into show-view plain data objects.
 * @augments Serializer
 */
class JobShowSerializer extends Serializer {
  /**
   * Serializes a single job instance into a full details object for the show view.
   *
   * @param {object} job - A job instance.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in the serialized object.
   * @returns {{ id: string, status: string, attempts: number, jobClass: string, arguments: object, remainingAttempts: number, readyInMs: number }} The serialized job data.
   */
  static _serializeObject(job, { status }) {
    return {
      id: job.id,
      status,
      attempts: job._attempts,
      jobClass: job.constructor.name,
      arguments: job.arguments,
      remainingAttempts: Math.max(0, job.maxRetries - job._attempts),
      readyInMs: Math.max(0, job.readyBy - Date.now()),
    };
  }
}

export { JobShowSerializer };
