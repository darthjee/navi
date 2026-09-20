import { JobRegistry } from 'deku-swarm';
import { NamespaceMap } from '../../../lib/registry/namespace/NamespaceMap.js';
import { ResourceEnqueuer } from '../../../lib/utils/ResourceEnqueuer.js';
import { NamespaceMapUtils } from '../../support/utils/NamespaceMapUtils.js';

const categoriesUrl = '/categories/{:id}.json';

function expectEnqueued(resourceRequest, parameters = {}) {
  expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest, parameters });
}

function expectOnlySkipped(result, skippedResources) {
  expect(JobRegistry.enqueue).not.toHaveBeenCalled();
  expect(result).toEqual({ enqueued: [], skippedResources });
}

describe('ResourceEnqueuer', () => {
  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('#enqueue', () => {
    beforeEach(() => {
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    it('enqueues every parameter-free request of a named resource', () => {
      const { home_page: homePageRequest } = NamespaceMapUtils.build({ default: { home_page: '/' } });

      const result = new ResourceEnqueuer().enqueue(['home_page']);

      expectEnqueued(homePageRequest);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    [
      {
        title: 'skips an unknown resource name as not_found',
        namespaces: {},
        names: ['missing'],
        skippedResources: [{ name: 'missing', reason: 'not_found' }],
      },
      {
        title: 'skips a resource entirely when any of its requests needs parameters',
        namespaces: { default: { categories: categoriesUrl } },
        names: ['categories'],
        skippedResources: [{ name: 'categories', reason: 'needs_params' }],
      },
      {
        title: 'skips a resource entirely when any of its requests is disabled',
        namespaces: { default: { disabled: { url: '/disabled.json', disabled: true } } },
        names: ['disabled'],
        skippedResources: [{ name: 'disabled', reason: 'disabled' }],
      },
      {
        title: 'skips a resource as disabled even when it also needs parameters',
        namespaces: { default: { disabled: { url: categoriesUrl, disabled: true } } },
        names: ['disabled'],
        skippedResources: [{ name: 'disabled', reason: 'disabled' }],
      },
      {
        title: 'does not fall back to the default namespace when resolving an explicit namespace',
        namespaces: { default: { home_page: '/' }, reports: {} },
        namespace: 'reports',
        names: ['home_page'],
        skippedResources: [{ name: 'home_page', reason: 'not_found' }],
      },
      {
        title: 'skips every name as not_found when the target namespace does not exist',
        namespaces: {},
        namespace: 'missing_namespace',
        names: ['home_page'],
        skippedResources: [{ name: 'home_page', reason: 'not_found' }],
      },
    ].forEach(({ title, namespaces, namespace, names, skippedResources }) => {
      it(title, () => {
        NamespaceMapUtils.build(namespaces);

        const result = new ResourceEnqueuer(namespace).enqueue(names);

        expectOnlySkipped(result, skippedResources);
      });
    });

    it('handles a mix of enqueued and skipped names in one call', () => {
      NamespaceMapUtils.build({ default: { home_page: '/', categories: categoriesUrl } });

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
      const { home_page: homePageRequest } = NamespaceMapUtils.build({ reports: { home_page: '/' } });

      const result = new ResourceEnqueuer('reports').enqueue(['home_page']);

      expectEnqueued(homePageRequest);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    describe('with per-entry and target-level parameters', () => {
      let categoryRequest;

      beforeEach(() => {
        ({ categories: categoryRequest } = NamespaceMapUtils.build({ default: { categories: categoriesUrl } }));
      });

      it('enqueues with the merged parameters when an entry object satisfies its tokens', () => {
        const result = new ResourceEnqueuer().enqueue([{ name: 'categories', parameters: { id: 1 } }]);

        expectEnqueued(categoryRequest, { id: 1 });
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('merges a target-level default underneath a per-resource override, per-resource winning on conflict', () => {
        const result = new ResourceEnqueuer().enqueue(
          [{ name: 'categories', parameters: { id: 2 } }],
          { parameters: { id: 1, extra: 'value' } },
        );

        expectEnqueued(categoryRequest, { id: 2, extra: 'value' });
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('skips as needs_params, echoing the merged parameters, when a required token is still missing after the merge', () => {
        const result = new ResourceEnqueuer().enqueue(
          [{ name: 'categories', parameters: { unrelated: 'value' } }],
        );

        expectOnlySkipped(result, [{ name: 'categories', reason: 'needs_params', parameters: { unrelated: 'value' } }]);
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

        expectEnqueued(categoryRequest, { id: 7 });
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('threads extra parameter keys with no matching token into the enqueued job parameters', () => {
        const result = new ResourceEnqueuer().enqueue(
          [{ name: 'categories', parameters: { id: 1, unrelated: 'value' } }],
        );

        expectEnqueued(categoryRequest, { id: 1, unrelated: 'value' });
        expect(result).toEqual({ enqueued: ['categories'], skippedResources: [] });
      });

      it('enqueues two separate jobs and pushes the name twice when the same resource repeats with different parameters', () => {
        const result = new ResourceEnqueuer().enqueue([
          { name: 'categories', parameters: { id: 1 } },
          { name: 'categories', parameters: { id: 2 } },
        ]);

        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expectEnqueued(categoryRequest, { id: 1 });
        expectEnqueued(categoryRequest, { id: 2 });
        expect(result).toEqual({ enqueued: ['categories', 'categories'], skippedResources: [] });
      });

      it('still skips as not_found even when parameters are supplied for an unknown name', () => {
        const result = new ResourceEnqueuer().enqueue([{ name: 'missing', parameters: { id: 1 } }]);

        expectOnlySkipped(result, [{ name: 'missing', reason: 'not_found' }]);
      });

      it('still skips as disabled even when parameters are supplied and would satisfy the tokens', () => {
        NamespaceMap.reset();
        NamespaceMapUtils.build({ default: { disabled: { url: categoriesUrl, disabled: true } } });

        const result = new ResourceEnqueuer().enqueue([{ name: 'disabled', parameters: { id: 1 } }]);

        expectOnlySkipped(result, [{ name: 'disabled', reason: 'disabled' }]);
      });
    });
  });

  describe('#enqueueAll', () => {
    beforeEach(() => {
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    it('enqueues every parameter-free, enabled resource request in the target namespace', () => {
      const { home_page: homePageRequest } = NamespaceMapUtils.build({
        reports: { home_page: '/', categories: categoriesUrl },
      });

      const result = new ResourceEnqueuer('reports').enqueueAll();

      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(1);
      expectEnqueued(homePageRequest);
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });

    it('does nothing when the target namespace does not exist', () => {
      NamespaceMapUtils.build();

      const result = new ResourceEnqueuer('missing_namespace').enqueueAll();

      expectOnlySkipped(result, []);
    });

    it('stays param-free-only, ignoring a target-level parameters argument', () => {
      const { home_page: homePageRequest } = NamespaceMapUtils.build({
        default: { home_page: '/', categories: categoriesUrl },
      });

      const result = new ResourceEnqueuer().enqueueAll({ parameters: { id: 1 } });

      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(1);
      expectEnqueued(homePageRequest);
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });
  });
});
