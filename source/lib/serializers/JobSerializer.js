/**
 * Serializes one or more job instances into plain data objects.
 */
class JobSerializer {
  /**
   * Serializes a job or a list of jobs into `{ id, status, attempts }` objects.
   *
   * When `jobOrList` is an array, each element is serialized individually.
   * When it is a single job object, returns `{ id, status, attempts }`.
   *
   * @param {object|object[]} jobOrList - A job instance or array of job instances.
   * @param {object} options - Serialization options.
   * @param {string} options.status - The status label to embed in each serialized object.
   * @returns {{ id: string, status: string, attempts: number }|{ id: string, status: string, attempts: number }[]} The serialized job data, or an array of serialized job data objects.
   */
  static serialize(jobOrList, { status }) {
    if (Array.isArray(jobOrList)) {
      return jobOrList.map(job => JobSerializer.serialize(job, { status }));
    }
    return { id: jobOrList.id, status, attempts: jobOrList._attempts };
  }
}

export { JobSerializer };
