import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  JobRegistryUtils.setup();

  describe('.hasReadyJob', () => {
    describe('when all queues are empty', () => {
      it('returns false', () => {
        expect(JobRegistry.hasReadyJob()).toBeFalse();
      });
    });

    describe('when enqueued has items', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      });

      it('returns true', () => {
        expect(JobRegistry.hasReadyJob()).toBeTrue();
      });
    });

    describe('when only failed has items (cooldown not elapsed)', () => {
      beforeEach(() => {
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(job);
      });

      it('returns false', () => {
        expect(JobRegistry.hasReadyJob()).toBeFalse();
      });
    });

    describe('when retryQueue has items', () => {
      beforeEach(() => {
        const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();
      });

      it('returns true', () => {
        expect(JobRegistry.hasReadyJob()).toBeTrue();
      });
    });
  });
});
