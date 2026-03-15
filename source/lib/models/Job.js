/**
 * Job represents a unit of work to be processed by a Worker.
 * @author darthjee
 */
class Job {
  /**
   * Creates a new Job instance.
   * @param {object} params - The parameters for creating a Job instance.
   * @param {*} params.payload - The data associated with this job.
   */
  constructor({ id, payload }) {
    this.id = id;
    this.payload = payload;
  }
}

export { Job };
