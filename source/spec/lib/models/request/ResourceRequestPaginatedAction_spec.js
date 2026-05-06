import { JobRegistry } from '../../../../lib/background/JobRegistry.js';
import { MissingActionResource } from '../../../../lib/exceptions/registry/MissingActionResource.js';
import { MissingMappingVariable } from '../../../../lib/exceptions/registry/MissingMappingVariable.js';
import { ResourceNotFound } from '../../../../lib/exceptions/registry/ResourceNotFound.js';
import { ResourceRequestPaginatedAction } from '../../../../lib/models/request/ResourceRequestPaginatedAction.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { ResourceRegistry } from '../../../../lib/registry/ResourceRegistry.js';
import { Application } from '../../../../lib/services/Application.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';
import { ResourceFactory } from '../../../support/factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../../../support/factories/ResourceRequestFactory.js';

const pagination = [{ pages: 'parsedBody.total_pages', page_key: 'page' }];

describe('ResourceRequestPaginatedAction', () => {
  beforeEach(() => {
    spyOn(Logger, 'info').and.stub();
    spyOn(LogRegistry, 'error').and.stub();
  });

  describe('constructor', () => {
    describe('when resource is missing', () => {
      it('throws MissingActionResource', () => {
        expect(() => new ResourceRequestPaginatedAction({ resource: undefined, pagination }))
          .toThrowMatching((error) => error instanceof MissingActionResource);
      });
    });
  });

  describe('.fromList', () => {
    describe('when called with undefined', () => {
      it('returns an empty array', () => {
        expect(ResourceRequestPaginatedAction.fromList()).toEqual([]);
      });
    });

    describe('when called with an empty array', () => {
      it('returns an empty array', () => {
        expect(ResourceRequestPaginatedAction.fromList([])).toEqual([]);
      });
    });

    describe('when all entries are valid', () => {
      it('returns one instance per entry', () => {
        const list = ResourceRequestPaginatedAction.fromList([
          { resource: 'products', pagination },
          { resource: 'category_information', pagination },
        ]);
        expect(list.length).toBe(2);
        expect(list.every((a) => a instanceof ResourceRequestPaginatedAction)).toBeTrue();
      });
    });

    describe('when one entry is missing resource', () => {
      it('logs the error and skips that entry', () => {
        const list = ResourceRequestPaginatedAction.fromList([
          { resource: 'products', pagination },
          { resource: undefined, pagination },
        ]);
        expect(list.length).toBe(1);
        expect(LogRegistry.error).toHaveBeenCalled();
      });
    });
  });

  describe('#execute', () => {
    const responseWrapper = {
      parsedBody: { total_pages: 3 },
      headers: {},
      parameters: {},
    };

    beforeEach(() => {
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
      ResourceRegistry.reset();
    });

    describe('basic 1-based pagination', () => {
      let resourceRequest;

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        const resource = ResourceFactory.build({ name: 'products', resourceRequests: [resourceRequest] });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues one ResourceRequestJob per page', () => {
        new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(responseWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(3);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 1 } }
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 2 } }
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 3 } }
        );
      });
    });

    describe('zero-indexed pagination', () => {
      let resourceRequest;

      const zeroPagination = [
        { pages: 'parsedBody.total_pages', page_key: 'page' },
        { zero_indexed: true },
      ];

      const zeroResponseWrapper = {
        parsedBody: { total_pages: 3 },
        headers: {},
        parameters: {},
      };

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        const resource = ResourceFactory.build({ name: 'products', resourceRequests: [resourceRequest] });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues jobs with 0-based page numbers', () => {
        new ResourceRequestPaginatedAction({ resource: 'products', pagination: zeroPagination }).execute(zeroResponseWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(3);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 0 } }
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { page: 2 } }
        );
      });
    });

    describe('with existing parameters on the wrapper', () => {
      let resourceRequest;

      const wrapperWithParams = {
        parsedBody: { total_pages: 2 },
        headers: {},
        parameters: { category_id: 5 },
      };

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: '/products.json' });
        const resource = ResourceFactory.build({ name: 'products', resourceRequests: [resourceRequest] });
        ResourceRegistry.build({ products: resource });
      });

      it('merges existing parameters with the page number', () => {
        new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(wrapperWithParams);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { category_id: 5, page: 1 } }
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest, parameters: { category_id: 5, page: 2 } }
        );
      });
    });

    describe('when the target resource has multiple ResourceRequests', () => {
      let resourceRequest1;
      let resourceRequest2;

      const singlePageWrapper = {
        parsedBody: { total_pages: 1 },
        headers: {},
        parameters: {},
      };

      beforeEach(() => {
        resourceRequest1 = ResourceRequestFactory.build({ url: '/products.json' });
        resourceRequest2 = ResourceRequestFactory.build({ url: '/products/{:page}.json' });
        const resource = ResourceFactory.build({
          name: 'products',
          resourceRequests: [resourceRequest1, resourceRequest2],
        });
        ResourceRegistry.build({ products: resource });
      });

      it('enqueues one job per resourceRequest per page', () => {
        new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(singlePageWrapper);
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: resourceRequest1, parameters: { page: 1 } }
        );
        expect(JobRegistry.enqueue).toHaveBeenCalledWith(
          'ResourceRequestJob',
          { resourceRequest: resourceRequest2, parameters: { page: 1 } }
        );
      });
    });

    describe('when the target resource is not found', () => {
      beforeEach(() => {
        ResourceRegistry.build({});
      });

      it('throws ResourceNotFound', () => {
        const action = new ResourceRequestPaginatedAction({ resource: 'unknown', pagination });
        expect(() => action.execute(responseWrapper))
          .toThrowMatching((error) => error instanceof ResourceNotFound);
      });
    });

    describe('when the pages path expression is missing from the wrapper', () => {
      beforeEach(() => {
        const resource = ResourceFactory.build({ name: 'products' });
        ResourceRegistry.build({ products: resource });
      });

      it('throws MissingMappingVariable', () => {
        const missingPagination = [{ pages: 'parsedBody.missing_field', page_key: 'page' }];
        const action = new ResourceRequestPaginatedAction({ resource: 'products', pagination: missingPagination });
        expect(() => action.execute(responseWrapper))
          .toThrowMatching((error) => error instanceof MissingMappingVariable);
      });
    });

    describe('when the application is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
        const resource = ResourceFactory.build({ name: 'products' });
        ResourceRegistry.build({ products: resource });
      });

      it('does not enqueue any job', () => {
        new ResourceRequestPaginatedAction({ resource: 'products', pagination }).execute(responseWrapper);
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });
  });
});
