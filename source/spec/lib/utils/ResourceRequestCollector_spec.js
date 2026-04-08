import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { ResourceRequestCollector } from '../../../lib/utils/ResourceRequestCollector.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceRequestCollector', () => {
  const paramFree = (url) => ResourceRequestFactory.build({ url });
  const withParam = (url) => ResourceRequestFactory.build({ url });

  const categoriesRequest = paramFree('/categories.json');
  const productsRequest = paramFree('/products.json');
  const categoryRequest = withParam('/categories/{:id}.json');
  const itemRequest = withParam('/categories/{:id}/items/{:item_id}');

  const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoriesRequest, categoryRequest] });
  const productsResource = ResourceFactory.build({ name: 'products', resourceRequests: [productsRequest, itemRequest] });

  describe('#allRequests', () => {
    it('returns a flat array of all requests from all resources', () => {
      const registry = new ResourceRegistry({ categories: categoriesResource, products: productsResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.allRequests()).toEqual([
        categoriesRequest,
        categoryRequest,
        productsRequest,
        itemRequest,
      ]);
    });

    it('returns an empty array when the registry has no resources', () => {
      const registry = new ResourceRegistry({});
      const collector = new ResourceRequestCollector(registry);

      expect(collector.allRequests()).toEqual([]);
    });

    it('returns an empty array when all resources have empty request lists', () => {
      const emptyResource = ResourceFactory.build({ name: 'empty', resourceRequests: [] });
      const registry = new ResourceRegistry({ empty: emptyResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.allRequests()).toEqual([]);
    });
  });

  describe('#requestsNeedingNoParams', () => {
    it('returns only requests with no placeholders in the URL', () => {
      const registry = new ResourceRegistry({ categories: categoriesResource, products: productsResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.requestsNeedingNoParams()).toEqual([
        categoriesRequest,
        productsRequest,
      ]);
    });

    it('returns an empty array when the registry has no resources', () => {
      const registry = new ResourceRegistry({});
      const collector = new ResourceRequestCollector(registry);

      expect(collector.requestsNeedingNoParams()).toEqual([]);
    });

    it('returns an empty array when all requests require parameters', () => {
      const paramResource = ResourceFactory.build({ name: 'param', resourceRequests: [categoryRequest, itemRequest] });
      const registry = new ResourceRegistry({ param: paramResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.requestsNeedingNoParams()).toEqual([]);
    });

    it('returns all requests when none require parameters', () => {
      const freeResource = ResourceFactory.build({ name: 'free', resourceRequests: [categoriesRequest, productsRequest] });
      const registry = new ResourceRegistry({ free: freeResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.requestsNeedingNoParams()).toEqual([
        categoriesRequest,
        productsRequest,
      ]);
    });
  });
});
