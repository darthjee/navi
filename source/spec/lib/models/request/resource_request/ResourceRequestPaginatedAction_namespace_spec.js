import { JobRegistry } from 'deku-swarm';
import { NamespaceNotFound } from '../../../../../lib/exceptions/registry/NamespaceNotFound.js';
import { ResourceRequestPaginatedAction } from '../../../../../lib/models/request/resource_request/ResourceRequestPaginatedAction.js';
import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';
import { PaginatedActionSpecUtils } from '../../../../support/utils/PaginatedActionSpecUtils.js';
import { ResourceActionUtils } from '../../../../support/utils/ResourceActionUtils.js';

const { pagination, responseWrapper, registerProductsResource } = PaginatedActionSpecUtils;

describe('ResourceRequestPaginatedAction', () => {
  ResourceActionUtils.setup();

  describe('#execute', () => {
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
