/**
 * Worker processes jobs pulled from a JobRegistry.
 * @author darthjee
 */
class Worker {
  #jobRegistry;
  #workersRegistry;
  #loggerFactory;
  #onWorkerIdle;

  /**
   * Creates a new Worker instance.
   * @param {object} params - The parameters for creating a Worker instance.
   * @param {string|number} params.id - The unique identifier for this worker.
   * @param {JobRegistry} params.jobRegistry - The job registry to report job outcomes to.
   * @param {WorkersRegistry} params.workersRegistry - The workers registry to report idle status to.
   * @param {Function} params.loggerFactory - Function that, given `{ workerId, jobId }`, returns a logger-like object exposing `debug/info/warn/error`.
   * @param {Function} [params.onWorkerIdle] - Optional payload-less hook called after the worker is marked idle. Errors it throws are caught and logged at `warn`. Defaults to a no-op.
   */
  constructor({ id, jobRegistry, workersRegistry, loggerFactory, onWorkerIdle = () => {} }) {
    this.id = id;
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
    this.#loggerFactory = loggerFactory;
    this.#onWorkerIdle = onWorkerIdle;
  }

  /**
   * Assigns a job to this worker.
   * @param {Job} job - The job to assign.
   * @returns {void}
   */
  assign(job) {
    this.job = job;
  }

  /**
   * Performs the assigned job. If no job is assigned, an error is thrown.
   * Any errors that occur during job execution are caught and logged.
   * @returns {Promise<void>}
   * @see Job.perform() for the actual job execution logic.
   */
  async perform() {
    if (!this.job) {
      throw new Error('No job assigned to worker');
    }

    const logContext = this.#loggerFactory({ workerId: this.id, jobId: this.job.id });

    try {
      await this.job.perform(logContext);
      this.#jobRegistry.finish(this.job);
    } catch (error) {
      logContext.error(`Error occurred while performing job: #${this.job.id} - ${error}`);
      this.#jobRegistry.fail(this.job);
    } finally {
      this.job = undefined;
      this.#workersRegistry.setIdle(this.id);
      this.#notifyIdle(logContext);
    }
  }

  #notifyIdle(logContext) {
    try {
      this.#onWorkerIdle();
    } catch (error) {
      logContext.warn(`onWorkerIdle hook failed for worker ${this.id}: ${error}`);
    }
  }
}

export { Worker };
