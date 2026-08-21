import { JobRegistry } from 'deku-swarm';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';
import { ResourceEnqueuer } from '../../../lib/utils/ResourceEnqueuer.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceEnqueuer', () => {
  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('#enqueue', () => {
    beforeEach(() => {
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    it('enqueues every parameter-free request of a named resource', () => {
      const homePageRequest = ResourceRequestFactory.build({ url: '/' });
      const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
      NamespaceMap.build({ default: new Namespace({ name: 'default', resources: { home_page: homePageResource } }) });

      const result = new ResourceEnqueuer().enqueue(['home_page']);

      expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    it('skips an unknown resource name as not_found', () => {
      NamespaceMap.build({ default: new Namespace({ name: 'default' }) });

      const result = new ResourceEnqueuer().enqueue(['missing']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'missing', reason: 'not_found' }] });
    });

    it('skips a resource entirely when any of its requests needs parameters', () => {
      const categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });
      NamespaceMap.build({ default: new Namespace({ name: 'default', resources: { categories: categoriesResource } }) });

      const result = new ResourceEnqueuer().enqueue(['categories']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'categories', reason: 'needs_params' }] });
    });

    it('skips a resource entirely when any of its requests is disabled', () => {
      const disabledRequest = ResourceRequestFactory.build({ url: '/disabled.json', disabled: true });
      const disabledResource = ResourceFactory.build({ name: 'disabled', resourceRequests: [disabledRequest] });
      NamespaceMap.build({ default: new Namespace({ name: 'default', resources: { disabled: disabledResource } }) });

      const result = new ResourceEnqueuer().enqueue(['disabled']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'disabled', reason: 'disabled' }] });
    });

    it('skips a resource as disabled even when it also needs parameters', () => {
      const disabledRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json', disabled: true });
      const disabledResource = ResourceFactory.build({ name: 'disabled', resourceRequests: [disabledRequest] });
      NamespaceMap.build({ default: new Namespace({ name: 'default', resources: { disabled: disabledResource } }) });

      const result = new ResourceEnqueuer().enqueue(['disabled']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'disabled', reason: 'disabled' }] });
    });

    it('handles a mix of enqueued and skipped names in one call', () => {
      const homePageRequest = ResourceRequestFactory.build({ url: '/' });
      const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
      const categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });
      NamespaceMap.build({
        default: new Namespace({
          name: 'default',
          resources: { home_page: homePageResource, categories: categoriesResource },
        }),
      });

      const result = new ResourceEnqueuer().enqueue(['home_page', 'categories', 'missing']);

      expect(result).toEqual({
        enqueued: ['home_page'],
        skippedResources: [
          { name: 'categories', reason: 'needs_params' },
          { name: 'missing', reason: 'not_found' },
        ],
      });
    });

    it('resolves resources against an explicit non-default namespace', () => {
      const homePageRequest = ResourceRequestFactory.build({ url: '/' });
      const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
      NamespaceMap.build({
        default: new Namespace({ name: 'default' }),
        reports: new Namespace({ name: 'reports', resources: { home_page: homePageResource } }),
      });

      const result = new ResourceEnqueuer('reports').enqueue(['home_page']);

      expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    it('does not fall back to the default namespace when resolving an explicit namespace', () => {
      const homePageResource = ResourceFactory.build({ name: 'home_page' });
      NamespaceMap.build({
        default: new Namespace({ name: 'default', resources: { home_page: homePageResource } }),
        reports: new Namespace({ name: 'reports' }),
      });

      const result = new ResourceEnqueuer('reports').enqueue(['home_page']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'home_page', reason: 'not_found' }] });
    });

    it('skips every name as not_found when the target namespace does not exist', () => {
      NamespaceMap.build({ default: new Namespace({ name: 'default' }) });

      const result = new ResourceEnqueuer('missing_namespace').enqueue(['home_page']);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'home_page', reason: 'not_found' }] });
    });
  });

  describe('#enqueueAll', () => {
    beforeEach(() => {
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    it('enqueues every parameter-free, enabled resource request in the target namespace', () => {
      const homePageRequest = ResourceRequestFactory.build({ url: '/' });
      const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
      const categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });
      NamespaceMap.build({
        default: new Namespace({ name: 'default' }),
        reports: new Namespace({
          name: 'reports',
          resources: { home_page: homePageResource, categories: categoriesResource },
        }),
      });

      const result = new ResourceEnqueuer('reports').enqueueAll();

      expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });

    it('does nothing when the target namespace does not exist', () => {
      NamespaceMap.build({ default: new Namespace({ name: 'default' }) });

      const result = new ResourceEnqueuer('missing_namespace').enqueueAll();

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });
  });
});
