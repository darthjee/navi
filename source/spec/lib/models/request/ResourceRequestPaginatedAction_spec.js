import { JobRegistry } from '../../../../lib/background/JobRegistry.js';
import { MissingActionResource } from '../../../../lib/exceptions/registry/MissingActionResource.js';
import { MissingMappingVariable } from '../../../../lib/exceptions/registry/MissingMappingVariable.js';
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

    it('does not enqueue any job when the application is stopped', () => {
      spyOn(Application, 'isStopped').and.returnValue(true);
      registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));

      new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(responseWrapper);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });
  });
});
