import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
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
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        const j = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();

        const before = Date.now() + 4900;
        JobRegistry.fail(j);
        const after = Date.now() + 5100;

        expect(j.readyBy).toBeGreaterThanOrEqual(before);
        expect(j.readyBy).toBeLessThanOrEqual(after);
      });

      it('moves the job to the failed queue, not retryQueue', () => {
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        const j = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(j);

        expect(JobRegistry.hasReadyJob()).toBeFalse();
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });
  });
});
