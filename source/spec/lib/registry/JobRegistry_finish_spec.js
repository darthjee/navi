import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  const ctx = JobRegistryUtils.setup();

  describe('.finish', () => {
    it('does not re-queue a picked job', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

      const picked = JobRegistry.pick();
      expect(picked).toBe(job);

      JobRegistry.finish(picked);

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(JobRegistry.pick()).toBeUndefined();
    });

    it('is safe to call with undefined', () => {
      expect(() => JobRegistry.finish(undefined)).not.toThrow();
    });

    it('removes the job from processing', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      const picked = JobRegistry.pick();

      expect(ctx.processing.has(picked.id)).toBeTrue();

      JobRegistry.finish(job);

      expect(ctx.processing.has(picked.id)).toBeFalse();
    });
  });
});
