import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  const ctx = JobRegistryUtils.setup();

  describe('.clearQueues', () => {
    let resourceRequest;

    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
    });

    describe('when there are enqueued jobs', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
      });

      it('removes all enqueued jobs', () => {
        expect(JobRegistry.hasJob()).toBeTrue();
        JobRegistry.clearQueues();
        expect(JobRegistry.hasJob()).toBeFalse();
      });

      it('does not affect processing jobs', () => {
        JobRegistry.pick();
        JobRegistry.clearQueues();
        expect(ctx.processing.size()).toBe(1);
      });

      it('does not affect finished jobs', () => {
        const job = JobRegistry.pick();
        JobRegistry.finish(job);
        JobRegistry.clearQueues();
        expect(ctx.finished.size()).toBe(1);
      });
    });
  });
});
