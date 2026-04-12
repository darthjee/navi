import { MissingActionResource } from '../../../lib/exceptions/MissingActionResource.js';
import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { ResourceNotFound } from '../../../lib/exceptions/ResourceNotFound.js';
import { ResourceRequestAction } from '../../../lib/models/ResourceRequestAction.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { ResourceRequestActionFactory } from '../../support/factories/ResourceRequestActionFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceRequestAction', () => {
  beforeEach(() => {
    spyOn(Logger, 'info').and.stub();
    spyOn(Logger, 'error').and.stub();
  });

  describe('constructor', () => {
    describe('when resource is missing', () => {
      it('throws MissingActionResource', () => {
        expect(() => new ResourceRequestAction({ resource: undefined }))
          .toThrowMatching((error) => error instanceof MissingActionResource);
      });
    });
  });

  describe('.fromList', () => {
    describe('when called with undefined', () => {
      it('returns an empty array', () => {
        expect(ResourceRequestAction.fromList()).toEqual([]);
      });
    });

    describe('when called with an empty array', () => {
      it('returns an empty array', () => {
        expect(ResourceRequestAction.fromList([])).toEqual([]);
      });
    });

    describe('when all entries are valid', () => {
      it('returns one instance per entry', () => {
        const list = ResourceRequestAction.fromList([
          { resource: 'products', parameters: { category_id: 'parsed_body.id' } },
          { resource: 'category_information' },
        ]);
        expect(list.length).toBe(2);
        expect(list.every((a) => a instanceof ResourceRequestAction)).toBeTrue();
      });
    });

    describe('when one entry is missing resource', () => {
      it('logs the error and skips that entry', () => {
        const list = ResourceRequestAction.fromList([
          { resource: 'products' },
          { resource: undefined },
        ]);
        expect(list.length).toBe(1);
        expect(Logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('#execute', () => {
    const responseWrapper = {
      parsed_body: { id: 1, name: 'Electronics' },
      headers: { page: '3' },
    };

    beforeEach(() => {
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
      ResourceRegistry.reset();
    });

    describe('without parameters', () => {
      let resourceRequest;

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        const resource = ResourceFactory.build({ name: 'products', resourceRequests: [resourceRequest] });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues a ResourceRequestJob with the wrapper as parameters', () => {
        ResourceRequestActionFactory.build({ resource: 'products' }).execute(responseWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: responseWrapper }
        );
      });
    });

    describe('with parameters', () => {
      let resourceRequest;

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        const resource = ResourceFactory.build({ name: 'products', resourceRequests: [resourceRequest] });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues a ResourceRequestJob with the mapped variables as parameters', () => {
        ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { category_id: 'parsed_body.id' },
        }).execute(responseWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { category_id: 1 } }
        );
      });
    });

    describe('when parameters map resolves header values', () => {
      let resourceRequest;

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        const resource = ResourceFactory.build({ name: 'products', resourceRequests: [resourceRequest] });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues a ResourceRequestJob with the header value as parameter', () => {
        ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { page: "headers['page']" },
        }).execute(responseWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: '3' } }
        );
      });
    });

    describe('when the target resource has multiple ResourceRequests', () => {
      let resourceRequest1;
      let resourceRequest2;

      beforeEach(() => {
        resourceRequest1 = ResourceRequestFactory.build({ url: '/products.json' });
        resourceRequest2 = ResourceRequestFactory.build({ url: '/products/{:category_id}.json' });
        const resource = ResourceFactory.build({
          name: 'products',
          resourceRequests: [resourceRequest1, resourceRequest2],
        });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues one ResourceRequestJob per ResourceRequest', () => {
        ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { category_id: 'parsed_body.id' },
        }).execute(responseWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: resourceRequest1, parameters: { category_id: 1 } }
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: resourceRequest2, parameters: { category_id: 1 } }
        );
      });
    });

    describe('when the target resource is not found', () => {
      beforeEach(() => {
        ResourceRegistry.build({});
      });

      it('throws ResourceNotFound', () => {
        const action = ResourceRequestActionFactory.build({ resource: 'unknown' });
        expect(() => action.execute(responseWrapper))
          .toThrowMatching((error) => error instanceof ResourceNotFound);
      });
    });

    describe('when a mapped path expression is missing from the wrapper', () => {
      beforeEach(() => {
        const resource = ResourceFactory.build({ name: 'products' });
        ResourceRegistry.build({ products: resource });
      });

      it('throws MissingMappingVariable', () => {
        const action = ResourceRequestActionFactory.build({
          resource: 'products',
          parameters: { dest: 'parsed_body.missing_field' },
        });
        expect(() => action.execute(responseWrapper))
          .toThrowMatching((error) => error instanceof MissingMappingVariable);
      });
    });
  });
});
