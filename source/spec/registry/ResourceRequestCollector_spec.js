import { Resource } from '../../lib/models/Resource.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { ResourceRegistry } from '../../lib/registry/ResourceRegistry.js';
import { ResourceRequestCollector } from '../../lib/registry/ResourceRequestCollector.js';

describe('ResourceRequestCollector', () => {
  const paramFree = (url) => new ResourceRequest({ url, status: 200 });
  const withParam = (url) => new ResourceRequest({ url, status: 200 });

  const categoriesRequest = paramFree('/categories.json');
  const productsRequest = paramFree('/products.json');
  const categoryRequest = withParam('/categories/{:id}.json');
  const itemRequest = withParam('/categories/{:id}/items/{:item_id}');

  const categoriesResource = new Resource({ name: 'categories', resourceRequests: [categoriesRequest, categoryRequest] });
  const productsResource = new Resource({ name: 'products', resourceRequests: [productsRequest, itemRequest] });

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
      const emptyResource = new Resource({ name: 'empty', resourceRequests: [] });
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
      const paramResource = new Resource({ name: 'param', resourceRequests: [categoryRequest, itemRequest] });
      const registry = new ResourceRegistry({ param: paramResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.requestsNeedingNoParams()).toEqual([]);
    });

    it('returns all requests when none require parameters', () => {
      const freeResource = new Resource({ name: 'free', resourceRequests: [categoriesRequest, productsRequest] });
      const registry = new ResourceRegistry({ free: freeResource });
      const collector = new ResourceRequestCollector(registry);

      expect(collector.requestsNeedingNoParams()).toEqual([
        categoriesRequest,
        productsRequest,
      ]);
    });
  });
});
