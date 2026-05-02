import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  JobRegistryUtils.setup();

  describe('.retryJob', () => {
    describe('when the job is in the failed queue', () => {
      let job;

      beforeEach(() => {
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
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
        JobRegistry.reset();
        JobRegistry.build({ cooldown: -1, maxRetries: 1 });
        job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

        JobRegistry.pick();
        try { job._fail(new Error('test')); } catch (_) { /* expected */ }
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();

        JobRegistry.pick();
        try { job._fail(new Error('test')); } catch (_) { /* expected */ }
        JobRegistry.fail(job);
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
