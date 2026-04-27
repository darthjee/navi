import { Serializer } from './Serializer.js';

const STATUSES_WITH_REMAINING_ATTEMPTS = new Set(['enqueued', 'processing', 'failed']);
const STATUSES_WITH_READY_IN_MS = new Set(['failed']);
const STATUSES_WITH_ERROR = new Set(['failed', 'dead']);

/**
 * Serializes one or more job instances into show-view plain data objects.
 * @augments Serializer
 */
class JobShowSerializer extends Serializer {
  /**
   * Serializes a single job instance into a full details object for the show view.
   * Fields are included conditionally based on the job's status and recorded error.
   *
   * @param {object} job - A job instance.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in the serialized object.
   * @returns {object} The serialized job data with status-appropriate fields.
   */
  static _serializeObject(job, { status }) {
    const result = {
      id: job.id,
      status,
      attempts: job._attempts,
      jobClass: job.constructor.name,
      arguments: job.arguments,
    };

    if (STATUSES_WITH_REMAINING_ATTEMPTS.has(status)) {
      result.remainingAttempts = Math.max(0, job.maxRetries - job._attempts);
    }

    if (STATUSES_WITH_READY_IN_MS.has(status)) {
      result.readyInMs = Math.max(0, job.readyBy - Date.now());
    }

    if (STATUSES_WITH_ERROR.has(status) && job.lastError !== null && job.lastError !== undefined) {
      result.lastError = job.lastError.message;
      result.backtrace = job.lastError.stack;
    }

    return result;
  }
}

export { JobShowSerializer };
