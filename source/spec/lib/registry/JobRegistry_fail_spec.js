import { JobRegistry } from 'deku-swarm';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  const ctx = JobRegistryUtils.setup();

  describe('.fail', () => {
    it('moves the failed job to the failed queue for later retry', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

      const picked = JobRegistry.pick();
      expect(picked).toBe(job);

      JobRegistry.fail(picked);

      expect(JobRegistry.hasJob()).toBeTrue();
      JobRegistry.promoteReadyJobs();
      expect(JobRegistry.pick()).toEqual(job);
    });

    it('removes the job from processing', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      const picked = JobRegistry.pick();

      expect(ctx.processing.has(picked.id)).toBeTrue();

      JobRegistry.fail(job);

      expect(ctx.processing.has(picked.id)).toBeFalse();
    });

    describe('when the job is not exhausted', () => {
      it('sets readyBy using the configured cooldown', () => {
        JobRegistryUtils.rebuild({ cooldown: 5000 });
        const j = JobRegistryUtils.enqueueAndPick();

        const before = Date.now() + 4900;
        JobRegistry.fail(j);
        const after = Date.now() + 5100;

        expect(j.readyBy).toBeGreaterThanOrEqual(before);
        expect(j.readyBy).toBeLessThanOrEqual(after);
      });

      it('moves the job to the failed queue, not retryQueue', () => {
        JobRegistryUtils.rebuild({ cooldown: 5000 });
        JobRegistry.fail(JobRegistryUtils.enqueueAndPick());

        expect(JobRegistry.hasReadyJob()).toBeFalse();
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });

    describe('when the job is exhausted', () => {
      it('moves the job to the dead queue using its own configured maxRetries', () => {
        JobRegistryUtils.rebuild({ cooldown: -1 });
        const j = JobRegistryUtils.enqueueAndPick({ parameters: { value: 1 }, maxRetries: 2 });

        JobRegistryUtils.failUntilDead(j, 2, new Error('test error'));

        expect(JobRegistry.hasJob()).toBeFalse();
        expect(JobRegistry.stats().dead).toBe(1);
      });
    });
  });
});
