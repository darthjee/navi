import { JobIndexSerializer } from './JobIndexSerializer.js';
import { JobShowSerializer } from './JobShowSerializer.js';

/**
 * Dispatcher serializer for job instances.
 * Delegates to {@link JobIndexSerializer} or {@link JobShowSerializer} based on the
 * `view` option.
 */
class JobSerializer {
  /**
   * Serializes a job or array of jobs using the appropriate serializer for the given view.
   *
   * @param {object|object[]} jobOrList - A single job instance or array of job instances.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in the serialized object.
   * @param {'index'|'show'} [options.view='index'] - The view type to serialize for.
   * @returns {object|object[]} The serialized job data.
   */
  static serialize(jobOrList, { status, view = 'index' } = {}) {
    const serializer = view === 'show' ? JobShowSerializer : JobIndexSerializer;
    return serializer.serialize(jobOrList, { status });
  }
}

export { JobSerializer };

