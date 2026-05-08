import { JobRegistry } from '../../../../lib/background/JobRegistry.js';
import { MissingActionResource } from '../../../../lib/exceptions/registry/MissingActionResource.js';
import { MissingMappingVariable } from '../../../../lib/exceptions/registry/MissingMappingVariable.js';
import { ResourceNotFound } from '../../../../lib/exceptions/registry/ResourceNotFound.js';
import { ResourceRequestAction } from '../../../../lib/models/request/ResourceRequestAction.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { Application } from '../../../../lib/services/Application.js';
import { ResourceRequestActionFactory } from '../../../support/factories/ResourceRequestActionFactory.js';
import { ResourceRequestFactory } from '../../../support/factories/ResourceRequestFactory.js';
import { ResourceActionUtils } from '../../../support/utils/ResourceActionUtils.js';

const responseWrapper = {
  parsedBody: { id: 1, name: 'Electronics' },
  headers: { page: '3' },
};

const registerProductsResource = (...resourceRequests) => {
  return ResourceActionUtils.registerResource('products', resourceRequests);
};

describe('ResourceRequestAction', () => {
  ResourceActionUtils.setup();

  describe('constructor', () => {
    it('throws MissingActionResource when resource is missing', () => {
      expect(() => new ResourceRequestAction({ resource: undefined }))
        .toThrowMatching((error) => error instanceof MissingActionResource);
    });
  });

  describe('.fromList', () => {
    [undefined, []].forEach((value) => {
      it(`returns an empty array when called with ${value === undefined ? 'undefined' : 'an empty array'}`, () => {
        expect(ResourceRequestAction.fromList(value)).toEqual([]);
      });
    });

    it('returns one instance per valid entry', () => {
      const list = ResourceRequestAction.fromList([
        { resource: 'products', parameters: { category_id: 'parsedBody.id' } },
        { resource: 'category_information' },
      ]);

      expect(list.length).toBe(2);
      expect(list.every((action) => action instanceof ResourceRequestAction)).toBeTrue();
    });

    it('logs the error and skips entries without resource', () => {
      const list = ResourceRequestAction.fromList([
        { resource: 'products' },
        { resource: undefined },
      ]);

      expect(list.length).toBe(1);
      expect(LogRegistry.error).toHaveBeenCalled();
    });
  });

  describe('#execute', () => {
    [
      {
        description: 'without parameters',
        action: ResourceRequestActionFactory.build({ resource: 'products' }),
        expectedParameters: {},
      },
      {
        description: 'with mapped body parameters',
        action: ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { category_id: 'parsedBody.id' },
        }),
        expectedParameters: { category_id: 1 },
      },
      {
        description: 'with mapped header parameters',
        action: ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { page: "headers['page']" },
        }),
        expectedParameters: { page: '3' },
      },
    ].forEach(({ description, action, expectedParameters }) => {
      it(`enqueues a ResourceRequestJob ${description}`, () => {
        const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });

        registerProductsResource(resourceRequest);
        action.execute(responseWrapper);

        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: expectedParameters },
        );
      });
    });

    it('enqueues one ResourceRequestJob per ResourceRequest', () => {
      const resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
      const parameterizedRequest = ResourceRequestFactory.build({ url: '/products/{:category_id}.json' });

      registerProductsResource(resourceRequest, parameterizedRequest);

      ResourceRequestActionFactory.build({
        resource: 'products',
        parameters: { category_id: 'parsedBody.id' },
      }).execute(responseWrapper);

      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
      expect(JobRegistry.enqueue).toHaveBeenCalledWith(
        'ResourceRequestJob',
        { resourceRequest, parameters: { category_id: 1 } },
      );
      expect(JobRegistry.enqueue).toHaveBeenCalledWith(
        'ResourceRequestJob',
        { resourceRequest: parameterizedRequest, parameters: { category_id: 1 } },
      );
    });

    it('throws ResourceNotFound when the target resource is missing', () => {
      ResourceActionUtils.registerResource('other', []);
      const action = ResourceRequestActionFactory.build({ resource: 'unknown' });

      expect(() => action.execute(responseWrapper))
        .toThrowMatching((error) => error instanceof ResourceNotFound);
    });

    it('throws MissingMappingVariable when a mapped path is missing', () => {
      registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));

      expect(() => {
        ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { dest: 'parsedBody.missing_field' },
        }).execute(responseWrapper);
      }).toThrowMatching((error) => error instanceof MissingMappingVariable);
    });

    it('does not enqueue any job when the application is stopped', () => {
      spyOn(Application, 'isStopped').and.returnValue(true);
      registerProductsResource(ResourceRequestFactory.build({ url: '/products.json' }));

      ResourceRequestActionFactory.build({ resource: 'products' }).execute(responseWrapper);

      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });
  });
});
