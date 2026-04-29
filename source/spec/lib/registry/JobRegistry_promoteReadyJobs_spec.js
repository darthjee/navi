import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  JobRegistryUtils.setup();

  describe('.promoteReadyJobs', () => {
    let readyJob, waitingJob;

    beforeEach(() => {
      JobRegistry.reset();
      JobRegistry.build({ cooldown: 5000 });
      readyJob = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      waitingJob = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });

      JobRegistry.pick();
      JobRegistry.pick();

      JobRegistry.fail(readyJob);
      JobRegistry.fail(waitingJob);

      readyJob.applyCooldown(-1000);
      waitingJob.applyCooldown(10_000);
    });

    it('moves the ready job to retryQueue', () => {
      JobRegistry.promoteReadyJobs();

      expect(JobRegistry.hasReadyJob()).toBeTrue();
    });

    it('keeps the waiting job in failed queue', () => {
      JobRegistry.promoteReadyJobs();

      expect(JobRegistry.hasJob()).toBeTrue();
      expect(JobRegistry.pick()).toEqual(readyJob);
      expect(JobRegistry.pick()).toBeUndefined();
    });

    describe('when called repeatedly', () => {
      it('is idempotent when no new jobs become ready', () => {
        JobRegistry.promoteReadyJobs();
        JobRegistry.promoteReadyJobs();

        JobRegistry.pick();
        expect(JobRegistry.pick()).toBeUndefined();
      });
    });
  });
});
