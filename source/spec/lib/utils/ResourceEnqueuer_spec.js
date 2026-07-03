import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { ResourceEnqueuer } from '../../../lib/utils/ResourceEnqueuer.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceEnqueuer', () => {
  afterEach(() => {
    ResourceRegistry.reset();
  });

  describe('#enqueue', () => {
    beforeEach(() => {
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    it('enqueues every parameter-free request of a named resource', () => {
      const homePageRequest = ResourceRequestFactory.build({ url: '/' });
      const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
      ResourceRegistry.build({ home_page: homePageResource });

      const result = new ResourceEnqueuer().enqueue(['home_page']);

      expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    it('skips an unknown resource name as not_found', () => {
      ResourceRegistry.build({});

      const result = new ResourceEnqueuer().enqueue(['missing']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'missing', reason: 'not_found' }] });
    });

    it('skips a resource entirely when any of its requests needs parameters', () => {
      const categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });
      ResourceRegistry.build({ categories: categoriesResource });

      const result = new ResourceEnqueuer().enqueue(['categories']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'categories', reason: 'needs_params' }] });
    });

    it('handles a mix of enqueued and skipped names in one call', () => {
      const homePageRequest = ResourceRequestFactory.build({ url: '/' });
      const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
      const categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });
      ResourceRegistry.build({ home_page: homePageResource, categories: categoriesResource });

      const result = new ResourceEnqueuer().enqueue(['home_page', 'categories', 'missing']);

      expect(result).toEqual({
        enqueued: ['home_page'],
        skippedResources: [
          { name: 'categories', reason: 'needs_params' },
          { name: 'missing', reason: 'not_found' },
        ],
      });
    });
  });
});
