import { JobRegistry } from 'deku-swarm';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  const ctx = JobRegistryUtils.setup();

  const itPicksInOrder = (firstDescription, getJobs) => {
    it(firstDescription, () => {
      expect(JobRegistry.pick()).toEqual(getJobs()[0]);
    });

    it('removes the job from the queue', () => {
      JobRegistry.pick();

      expect(JobRegistry.pick()).toEqual(getJobs()[1]);
    });

    it('decreases the queue size', () => {
      JobRegistry.pick();

      expect(JobRegistry.hasJob()).toBeTrue();

      JobRegistry.pick();

      expect(JobRegistry.hasJob()).toBeFalse();
    });
  };

  describe('.pick', () => {
    describe('when the queue is empty', () => {
      it('returns undefined', () => {
        expect(JobRegistry.pick()).toBeUndefined();
      });

      it('does not add anything to processing', () => {
        JobRegistry.pick();

        expect(ctx.processing.hasAny()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      });

      itPicksInOrder('returns the first job', () => [job1, job2]);

      it('adds the picked job to processing', () => {
        const job = JobRegistry.pick();

        expect(ctx.processing.has(job.id)).toBeTrue();
      });
    });

    describe('when the queue has a failed job', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      });

      itPicksInOrder('returns the first job', () => [job1, job2]);
    });

    describe('when the queue has failed and not failed jobs', () => {
      let job1, job2;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job1 = JobRegistry.pick();
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
        JobRegistry.fail(job1);
        JobRegistry.promoteReadyJobs();
      });

      itPicksInOrder('returns the first not failed job', () => [job2, job1]);
    });

    describe('when enqueued is empty and retryQueue has items', () => {
      let failedJob;

      beforeEach(() => {
        failedJob = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(failedJob);
        JobRegistry.promoteReadyJobs();
      });

      it('returns the job from retryQueue', () => {
        expect(JobRegistry.pick()).toEqual(failedJob);
      });

      it('adds the job to processing', () => {
        JobRegistry.pick();
        expect(ctx.processing.has(failedJob.id)).toBeTrue();
      });

      it('empties retryQueue afterwards', () => {
        JobRegistry.pick();
        expect(JobRegistry.hasReadyJob()).toBeFalse();
      });
    });
  });
});
