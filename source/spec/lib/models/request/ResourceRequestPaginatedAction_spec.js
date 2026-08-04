import { JobRegistry } from '../../../../lib/background/JobRegistry.js';
import { MissingActionResource } from '../../../../lib/exceptions/registry/MissingActionResource.js';
import { MissingMappingVariable } from '../../../../lib/exceptions/registry/MissingMappingVariable.js';
import { NamespaceNotFound } from '../../../../lib/exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../../../../lib/exceptions/registry/ResourceNotFound.js';
import { ResourceRequestPaginatedAction } from '../../../../lib/models/request/ResourceRequestPaginatedAction.js';
import { Application } from '../../../../lib/services/Application.js';
import { ResourceRequestFactory } from '../../../support/factories/ResourceRequestFactory.js';
import { ResourceActionUtils } from '../../../support/utils/ResourceActionUtils.js';

const pagination = [{ pages: 'parsedBody.total_pages', page_key: 'page' }];
const responseWrapper = {
  parsedBody: { total_pages: 3 },
  headers: {},
  parameters: {},
};

const registerProductsResource = (...resourceRequests) => {
  return ResourceActionUtils.registerResource('products', resourceRequests);
};

describe('ResourceRequestPaginatedAction', () => {
  ResourceActionUtils.setup();

  describe('constructor', () => {
    it('throws MissingActionResource when resource is missing', () => {
      expect(() => new ResourceRequestPaginatedAction({ resource: undefined, pagination }))
        .toThrowMatching((error) => error instanceof MissingActionResource);
    });
  });

  describe('.fromList', () => {
    [undefined, []].forEach((value) => {
      it(`returns an empty array when called with ${value === undefined ? 'undefined' : 'an empty array'}`, () => {
        expect(ResourceRequestPaginatedAction.fromList(value)).toEqual([]);
      });
    });

    it('returns one instance per valid entry', () => {
      const list = ResourceRequestPaginatedAction.fromList([
        { resource: 'products', pagination },
        { resource: 'category_information', pagination },
      ]);

      expect(list.length).toBe(2);
      expect(list.every((action) => action instanceof ResourceRequestPaginatedAction)).toBeTrue();
    });

    it('logs the error and skips entries without resource', () => {
      const list = ResourceRequestPaginatedAction.fromList([
        { resource: 'products', pagination },
        { resource: undefined, pagination },
      ]);

      expect(list.length).toBe(1);
    });
  });

  describe('#execute', () => {
    [
      {
        description: 'with basic 1-based pagination',
        action: new ResourceRequestPaginatedAction({ resource: 'products', pagination }),
        wrapper: responseWrapper,
        parameters: undefined,
        expectedCalls: [
          { page: 1 },
          { page: 2 },
          { page: 3 },
        ],
      },
      {
        description: 'with zero-indexed pagination',
        action: new ResourceRequestPaginatedAction({
          resource: 'products',
          pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }, { zero_indexed: true }],
        }),
        wrapper: responseWrapper,
        parameters: undefined,
        expectedCalls: [
          { page: 0 },
          { page: 1 },
          { page: 2 },
        ],
      },
      {
        description: 'with existing parameters',
        action: new ResourceRequestPaginatedAction({ resource: 'products', pagination }),
        wrapper: { parsedBody: { total_pages: 2 }, headers: {} },
        parameters: { category_id: 5 },
        expectedCalls: [
          { category_id: 5, page: 1 },
          { category_id: 5, page: 2 },
        ],
      },
    ].forEach(({ description, action, wrapper, parameters, expectedCalls }) => {
      it(`enqueues the expected jobs ${description}`, () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });

        registerProductsResource(resourceRequest);
        action.execute(wrapper, parameters);

        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(expectedCalls.length);
        expectedCalls.forEach((expectedParameters) => {
          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest, parameters: expectedParameters },
          );
        });
      });
    });

    it('enqueues one job per ResourceRequest per page', () => {
      const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
      const parameterizedRequest = ResourceRequestFactory.build({ url: '/products/{:page}.json' });

      registerProductsResource(resourceRequest, parameterizedRequest);

      new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute({
        parsedBody: { total_pages: 1 },
        headers: {},
        parameters: {},
      });

      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
      expect(JobRegistry.enqueue).toHaveBeenCalledWith(
        'ResourceRequestJob',
        { resourceRequest, parameters: { page: 1 } },
      );
      expect(JobRegistry.enqueue).toHaveBeenCalledWith(
        'ResourceRequestJob',
        { resourceRequest: parameterizedRequest, parameters: { page: 1 } },
      );
    });

    it('skips disabled ResourceRequests when enqueueing the target resource', () => {
      const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
      const disabledRequest = ResourceRequestFactory.build({ url: '/products/disabled.json', disabled: true });

      registerProductsResource(resourceRequest, disabledRequest);

      new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(responseWrapper);

      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(3);
      [1, 2, 3].forEach((page) => {
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page } },
        );
      });
    });

    it('does not enqueue anything when every ResourceRequest of the target resource is disabled', () => {
      const disabledRequest = ResourceRequestFactory.build({ url: '/products/disabled.json', disabled: true });

      registerProductsResource(disabledRequest);

      new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(responseWrapper);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });

    it('throws ResourceNotFound when the target resource is missing', () => {
      ResourceActionUtils.registerResource('other', []);
      const action = new ResourceRequestPaginatedAction({ resource: 'unknown', pagination });

      expect(() => action.execute(responseWrapper))
        .toThrowMatching((error) => error instanceof ResourceNotFound);
    });

    it('throws MissingMappingVariable when the pages path is missing', () => {
      registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));

      expect(() => {
        new ResourceRequestPaginatedAction({
          resource: 'products',
          pagination: [{ pages: 'parsedBody.missing_field', page_key: 'page' }],
        }).execute(responseWrapper);
      }).toThrowMatching((error) => error instanceof MissingMappingVariable);
    });

    describe('parameters', () => {
      const wrapper = {
        parsedBody: { total_pages: 2 },
        headers: { 'x-per-page': '20' },
        parameters: {},
      };

      it('resolves the configured parameters into every enqueued job, per page', () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        registerProductsResource(resourceRequest);

        new ResourceRequestPaginatedAction({
          resource: 'products',
          pagination,
          parameters: { per_page: "headers['x-per-page']" },
        }).execute(wrapper);

        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        [1, 2].forEach((page) => {
          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest, parameters: { per_page: '20', page } },
          );
        });
      });

      it('overrides same-named inherited parameters with the resolved parameters values', () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        registerProductsResource(resourceRequest);

        new ResourceRequestPaginatedAction({
          resource: 'products',
          pagination,
          parameters: { per_page: "headers['x-per-page']" },
        }).execute(wrapper, { per_page: 5 });

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { per_page: '20', page: 1 } },
        );
      });

      it('always keeps the page_key value even when parameters defines the same key', () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        registerProductsResource(resourceRequest);

        new ResourceRequestPaginatedAction({
          resource: 'products',
          pagination,
          parameters: { page: "headers['x-per-page']" },
        }).execute(wrapper);

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 1 } },
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 2 } },
        );
      });

      it('behaves exactly as when parameters is omitted', () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        registerProductsResource(resourceRequest);

        new ResourceRequestPaginatedAction({ resource: 'products', pagination })
          .execute(wrapper, { category_id: 5 });

        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { category_id: 5, page: 1 } },
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { category_id: 5, page: 2 } },
        );
      });

      it('throws MissingMappingVariable when a parameters path expression is unresolved', () => {
        registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));

        expect(() => {
          new ResourceRequestPaginatedAction({
            resource: 'products',
            pagination,
            parameters: { per_page: "headers['x-missing']" },
          }).execute(wrapper);
        }).toThrowMatching((error) => error instanceof MissingMappingVariable);
      });
    });

    it('does not enqueue any job when the application is stopped', () => {
      spyOn(Application, 'isStopped').and.returnValue(true);
      registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));

      new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(responseWrapper);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });

    describe('namespace resolution', () => {
      it('exposes the resource name, target namespace, and origin namespace', () => {
        const action = new ResourceRequestPaginatedAction({
          resource: 'products',
          namespace: 'paginated',
          originNamespace: 'default',
          pagination,
        });

        expect(action.resource).toBe('products');
        expect(action.namespace).toBe('paginated');
        expect(action.originNamespace).toBe('default');
      });

      it('resolves the target resource from an explicit namespace', () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/paginated/products.json' });
        ResourceActionUtils.registerResource('products', [resourceRequest], { namespace: 'paginated' });
        const singlePageWrapper = { parsedBody: { total_pages: 1 }, headers: {} };

        new ResourceRequestPaginatedAction({
          resource: 'products',
          namespace: 'paginated',
          originNamespace: 'default',
          pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }],
        }).execute(singlePageWrapper);

        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 1 } },
        );
      });

      it('falls back to the default namespace when the origin namespace lookup fails', () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        registerProductsResource(resourceRequest);
        const singlePageWrapper = { parsedBody: { total_pages: 1 }, headers: {} };

        new ResourceRequestPaginatedAction({
          resource: 'products',
          originNamespace: 'paginated',
          pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }],
        }).execute(singlePageWrapper);

        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 1 } },
        );
      });

      it('throws NamespaceNotFound when the explicit target namespace does not exist', () => {
        registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));
        const action = new ResourceRequestPaginatedAction({ resource: 'products', namespace: 'unknown', pagination });

        expect(() => action.execute(responseWrapper))
          .toThrowMatching((error) => error instanceof NamespaceNotFound);
      });
    });
  });
});
