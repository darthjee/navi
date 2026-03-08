/**
 * Worker processes jobs pulled from a JobRegistry.
 * @author darthjee
 */
class Worker {
  /**
   * Creates a new Worker instance.
   * @param {object} params - The parameters for creating a Worker instance.
   * @param {JobRegistry} params.jobRegistry - The job registry to pull jobs from.
   */
  constructor({ jobRegistry }) {
    this.jobRegistry = jobRegistry;
  }
}

export { Worker };
