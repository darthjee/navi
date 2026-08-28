import { ResourceQueueFacade } from '../../../../lib/services/application/ResourceQueueFacade.js';
import { ResourceEnqueuer } from '../../../../lib/utils/ResourceEnqueuer.js';

describe('ResourceQueueFacade', () => {
  let facade;

  beforeEach(() => {
    facade = new ResourceQueueFacade();
  });

  describe('#enqueueFirstJobs', () => {
    it('delegates to ResourceEnqueuer#enqueueAll', () => {
      spyOn(ResourceEnqueuer.prototype, 'enqueueAll').and.stub();

      facade.enqueueFirstJobs();

      expect(ResourceEnqueuer.prototype.enqueueAll).toHaveBeenCalled();
    });
  });

  describe('#enqueueResources', () => {
    it('falls back to enqueueFirstJobs when no names are given', () => {
      spyOn(facade, 'enqueueFirstJobs').and.stub();

      const result = facade.enqueueResources();

      expect(facade.enqueueFirstJobs).toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });

    it('delegates named resources to ResourceEnqueuer', () => {
      spyOn(ResourceEnqueuer.prototype, 'enqueue').and.returnValue({ enqueued: ['home_page'], skippedResources: [] });

      const result = facade.enqueueResources(['home_page']);

      expect(ResourceEnqueuer.prototype.enqueue).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });
  });
});
