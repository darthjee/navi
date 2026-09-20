import { JobRegistry } from 'deku-swarm';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  JobRegistryUtils.setup();

  describe('.retryJob', () => {
    describe('when the job is in the failed queue', () => {
      let job;

      beforeEach(() => {
        JobRegistryUtils.rebuild({ cooldown: 5000 });
        job = JobRegistryUtils.enqueueAndPick();
        JobRegistry.fail(job);
      });

      it('moves the job to the retry queue', () => {
        JobRegistry.retryJob(job.id);

        expect(JobRegistry.hasReadyJob()).toBeTrue();
        expect(JobRegistry.pick()).toBe(job);
      });

      it('removes the job from the failed queue', () => {
        JobRegistry.retryJob(job.id);

        expect(JobRegistry.hasJob()).toBeTrue();
        JobRegistry.promoteReadyJobs();
        expect(JobRegistry.hasJob()).toBeTrue();

        const picked = JobRegistry.pick();
        expect(picked).toBe(job);
        expect(JobRegistry.pick()).toBeUndefined();
      });

      it('returns the job', () => {
        const result = JobRegistry.retryJob(job.id);

        expect(result).toBe(job);
      });
    });

    describe('when the job is in the dead queue', () => {
      let job;

      beforeEach(() => {
        JobRegistryUtils.rebuild({ cooldown: -1 });
        job = JobRegistryUtils.enqueueAndPick({ parameters: { value: 1 }, maxRetries: 1 });
        JobRegistryUtils.failUntilDead(job, 2, new Error('test'));
      });

      it('moves the job to the retry queue', () => {
        JobRegistry.retryJob(job.id);

        expect(JobRegistry.hasReadyJob()).toBeTrue();
        expect(JobRegistry.pick()).toBe(job);
      });

      it('removes the job from the dead queue', () => {
        expect(JobRegistry.stats().dead).toBe(1);

        JobRegistry.retryJob(job.id);

        expect(JobRegistry.stats().dead).toBe(0);
      });

      it('returns the job', () => {
        const result = JobRegistry.retryJob(job.id);

        expect(result).toBe(job);
      });
    });

    describe('when the job is not in a retryable queue', () => {
      it('returns null', () => {
        const result = JobRegistry.retryJob('nonexistent-id');

        expect(result).toBeNull();
      });
    });
  });
});
