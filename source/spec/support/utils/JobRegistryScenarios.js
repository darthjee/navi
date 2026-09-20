import { JobRegistry } from 'deku-swarm';
import { JobRegistryUtils } from './JobRegistryUtils.js';

/**
 * Shared job lifecycle scenarios used to table-drive JobRegistry specs.
 *
 * Each scenario describes how a job reaches a given status. The `setup` function
 * runs against the current JobRegistry (so it must be called after
 * `JobRegistryUtils.setup()` has built it, e.g. inside a `beforeEach`) and
 * returns the resulting job.
 */
class JobRegistryScenarios {
  /**
   * Returns the ordered list of lifecycle scenarios.
   * @returns {Array<{ status: string, description: string, setup: function(object): Job }>} Scenarios in lifecycle order.
   */
  static all() {
    return [
      {
        status: 'enqueued',
        description: 'a job has been enqueued',
        setup: (attributes) => JobRegistry.enqueue('ResourceRequestJob', attributes),
      },
      {
        status: 'processing',
        description: 'a job is being processed',
        setup: (attributes) => JobRegistryScenarios.#pick(attributes),
      },
      {
        status: 'finished',
        description: 'a job has finished',
        setup: (attributes) => {
          const job = JobRegistryScenarios.#pick(attributes);
          JobRegistry.finish(job);
          return job;
        },
      },
      {
        status: 'failed',
        description: 'a non-exhausted job has failed',
        setup: (attributes) => {
          const job = JobRegistryScenarios.#pick(attributes);
          JobRegistry.fail(job);
          return job;
        },
      },
      {
        status: 'retryQueue',
        description: 'a failed job is promoted to retryQueue',
        setup: (attributes) => {
          const job = JobRegistryScenarios.#pick(attributes);
          JobRegistry.fail(job);
          JobRegistry.promoteReadyJobs();
          return job;
        },
      },
      {
        status: 'dead',
        description: 'an exhausted job has failed',
        setup: (attributes) => {
          const job = JobRegistryScenarios.#pick(attributes);
          JobRegistryUtils.exhaust(job);
          JobRegistry.fail(job);
          return job;
        },
      },
    ];
  }

  /**
   * Enqueues a job and picks it, moving it to processing.
   * @param {object} attributes - Attributes used to enqueue the job.
   * @returns {Job} The picked job.
   */
  static #pick(attributes) {
    return JobRegistryUtils.enqueueAndPick(attributes);
  }
}

export { JobRegistryScenarios };
