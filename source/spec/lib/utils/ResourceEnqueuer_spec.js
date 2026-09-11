import { JobRegistry } from 'deku-swarm';
import { Namespace } from '../../../lib/registry/namespace/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/namespace/NamespaceMap.js';
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

    describe('with per-entry and target-level parameters', () => {
      let categoryRequest;
      let categoriesResource;

      beforeEach(() => {
        categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
        categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });
        NamespaceMap.build({ default: new Namespace({ name: 'default', resources: { categories: categoriesResource } }) });
      });

      it('enqueues with the merged parameters when an entry object satisfies its tokens', () => {
        const result = new ResourceEnqueuer().enqueue([{ name: 'categories', parameters: { id: 1 } }]);

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: categoryRequest, parameters: { id: 1 } },
        );
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('merges a target-level default underneath a per-resource override, per-resource winning on conflict', () => {
        const result = new ResourceEnqueuer().enqueue(
          [{ name: 'categories', parameters: { id: 2 } }],
          { parameters: { id: 1, extra: 'value' } },
        );

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: categoryRequest, parameters: { id: 2, extra: 'value' } },
        );
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('skips as needs_params, echoing the merged parameters, when a required token is still missing after the merge', () => {
        const result = new ResourceEnqueuer().enqueue(
          [{ name: 'categories', parameters: { unrelated: 'value' } }],
        );

        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
        expect(result).toEqual({
          enqueued: [],
          skippedResources: [{ name: 'categories', reason: 'needs_params', parameters: { unrelated: 'value' } }],
        });
      });

      it('does not echo a parameters key when no parameters were supplied at all', () => {
        const result = new ResourceEnqueuer().enqueue(['categories']);

        expect(result).toEqual({
          enqueued: [],
          skippedResources: [{ name: 'categories', reason: 'needs_params' }],
        });
      });

      it('applies the target-level default as-is to a bare-string entry', () => {
        const result = new ResourceEnqueuer().enqueue(['categories'], { parameters: { id: 7 } });

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: categoryRequest, parameters: { id: 7 } },
        );
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('threads extra parameter keys with no matching token into the enqueued job parameters', () => {
        const result = new ResourceEnqueuer().enqueue(
          [{ name: 'categories', parameters: { id: 1, unrelated: 'value' } }],
        );

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: categoryRequest, parameters: { id: 1, unrelated: 'value' } },
        );
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('enqueues two separate jobs and pushes the name twice when the same resource repeats with different parameters', () => {
        const result = new ResourceEnqueuer().enqueue([
          { name: 'categories', parameters: { id: 1 } },
          { name: 'categories', parameters: { id: 2 } },
        ]);

        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: categoryRequest, parameters: { id: 1 } },
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: categoryRequest, parameters: { id: 2 } },
        );
        expect(result).toEqual({ enqueued: ['categories', 'categories'], skippedResources: [] });
      });

      it('still skips as not_found even when parameters are supplied for an unknown name', () => {
        const result = new ResourceEnqueuer().enqueue([{ name: 'missing', parameters: { id: 1 } }]);

        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
        expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'missing', reason: 'not_found' }] });
      });

      it('still skips as disabled even when parameters are supplied and would satisfy the tokens', () => {
        const disabledRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json', disabled: true });
        const disabledResource = ResourceFactory.build({ name: 'disabled', resourceRequests: [disabledRequest] });
        NamespaceMap.reset();
        NamespaceMap.build({ default: new Namespace({ name: 'default', resources: { disabled: disabledResource } }) });

        const result = new ResourceEnqueuer().enqueue([{ name: 'disabled', parameters: { id: 1 } }]);

        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
        expect(result).toEqual({ enqueued: [], skippedResources: [{ name: 'disabled', reason: 'disabled' }] });
      });
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

    it('stays param-free-only, ignoring a target-level parameters argument', () => {
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

      const result = new ResourceEnqueuer().enqueueAll({ parameters: { id: 1 } });

      expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });
  });
});
