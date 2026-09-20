import { Job } from 'deku-swarm';

/**
 * Shared examples for the lifecycle behaviour common to every Job subclass spec.
 *
 * Each method registers `it` blocks in the `describe` that is currently being
 * defined, so it must be called from inside the caller's `describe` (and the
 * resulting spec names read exactly as if they had been written inline). Jobs
 * and log contexts are received through getters so the values built in the
 * caller's `beforeEach` are the ones used. Any arrangement (stubbing HTTP
 * calls, making an action throw, ...) is done by the caller's own `beforeEach`.
 */
class JobLifecycleExamples {
  /**
   * Registers the specs asserting a job keeps the id it was built with and is a Job.
   * @param {object} params - Example parameters.
   * @param {function(): Job} params.getJob - Returns the job under test.
   * @param {string} params.expectedId - The id the job was built with.
   * @param {boolean} [params.checkInstance=true] - Whether to register the `is an instance of Job` spec.
   */
  static identityExamples({ getJob, expectedId, checkInstance = true }) {
    it('stores the id', () => {
      expect(getJob().id).toEqual(expectedId);
    });

    if (checkInstance) {
      it('is an instance of Job', () => {
        expect(getJob()).toBeInstanceOf(Job);
      });
    }
  }

  /**
   * Registers the specs asserting a successful `perform` leaves the job healthy.
   * Must be called inside a `describe` whose `beforeEach` makes `perform` succeed.
   * @param {object} params - Example parameters.
   * @param {function(): Job} params.getJob - Returns the job under test.
   * @param {function(): object} params.getLogContext - Returns the logContext passed to `perform`.
   */
  static successExamples({ getJob, getLogContext }) {
    it('clears lastError before performing', async () => {
      const job = getJob();
      job.lastError = new Error('previous error');
      await job.perform(getLogContext());
      expect(job.lastError).toBeUndefined();
    });

    it('does not exhaust after a successful attempt', async () => {
      const job = getJob();
      await job.perform(getLogContext());
      expect(job.exhausted()).toBeFalse();
    });
  }

  /**
   * Registers the spec asserting a job becomes exhausted only after `maxRetries` failed attempts.
   * Must be called inside a `describe` whose `beforeEach` makes `perform` fail.
   * @param {object} params - Example parameters.
   * @param {function(): Job} params.getJob - Returns the job under test.
   * @param {function(): object} params.getLogContext - Returns the logContext passed to `perform`.
   * @param {number} params.maxRetries - The number of failed attempts after which the job is exhausted.
   * @param {string} [params.description='is exhausted after the configured max retries'] - The spec description.
   */
  static exhaustionExample({
    getJob,
    getLogContext,
    maxRetries,
    description = 'is exhausted after the configured max retries',
  }) {
    it(description, async () => {
      const job = getJob();

      for (let attempt = 1; attempt < maxRetries; attempt++) {
        await job.perform(getLogContext()).catch(() => {});
      }
      expect(job.exhausted()).toBeFalse();

      await job.perform(getLogContext()).catch(() => {});
      expect(job.exhausted()).toBeTrue();
    });
  }
}

export { JobLifecycleExamples };
