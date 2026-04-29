import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  JobRegistryUtils.setup();

  describe('.hasJob', () => {
    describe('when the queue is empty', () => {
      it('returns false', () => {
        expect(JobRegistry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', {});
      });

      it('returns true', () => {
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });

    describe('when only the retryQueue has items', () => {
      beforeEach(() => {
        const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();
      });

      it('returns true', () => {
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });
  });
});
