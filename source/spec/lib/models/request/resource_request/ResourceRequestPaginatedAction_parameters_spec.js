import { JobRegistry } from 'deku-swarm';
import { MissingMappingVariable } from '../../../../../lib/exceptions/registry/MissingMappingVariable.js';
import { ResourceRequestPaginatedAction } from '../../../../../lib/models/request/resource_request/ResourceRequestPaginatedAction.js';
import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';
import { PaginatedActionSpecUtils } from '../../../../support/utils/PaginatedActionSpecUtils.js';
import { ResourceActionUtils } from '../../../../support/utils/ResourceActionUtils.js';

const { pagination, registerProductsResource } = PaginatedActionSpecUtils;

describe('ResourceRequestPaginatedAction', () => {
  ResourceActionUtils.setup();

  describe('#execute', () => {
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
  });
});
