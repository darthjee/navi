import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  const ctx = JobRegistryUtils.setup();

  describe('.requeue', () => {
    describe('when the job is in processing', () => {
      let job;

      beforeEach(() => {
        job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
      });

      it('removes the job from processing', () => {
        expect(ctx.processing.has(job.id)).toBeTrue();

        JobRegistry.requeue(job);

        expect(ctx.processing.has(job.id)).toBeFalse();
      });

      it('adds the job back to the enqueued queue', () => {
        JobRegistry.requeue(job);

        expect(JobRegistry.hasReadyJob()).toBeTrue();
      });

      it('allows the job to be picked again', () => {
        JobRegistry.requeue(job);

        expect(JobRegistry.pick()).toEqual(job);
      });
    });

    describe('when there are multiple jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
        JobRegistry.pick();
      });

      it('requeues the job after existing enqueued jobs', () => {
        JobRegistry.requeue(job1);

        expect(JobRegistry.pick()).toEqual(job2);
        expect(JobRegistry.pick()).toEqual(job1);
      });
    });

    describe('when called with null', () => {
      it('does not throw', () => {
        expect(() => JobRegistry.requeue(null)).not.toThrow();
      });
    });

    describe('when called with undefined', () => {
      it('does not throw', () => {
        expect(() => JobRegistry.requeue(undefined)).not.toThrow();
      });
    });
  });
});
