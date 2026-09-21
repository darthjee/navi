import { mockFetchSuccess, paginationHeaders } from 'navi-spec-support/fetch.js';
import { fetchItem, fetchItems } from '../../src/clients/ItemsClient.js';
import { itRejectsWithStatus, itRequests, itResolvesWith } from '../support/client_scenarios.js';

describe('ItemsClient', () => {
  describe('fetchItems', () => {
    describe('when the request succeeds', () => {
      const data = [{ id: 1, name: 'Laptop' }];

      mockFetchSuccess(data, paginationHeaders({ page: 2, pageSize: 5, pages: 4 }));

      itRequests([
        {
          description: 'fetches from /categories/:categoryId/items.json',
          call: () => fetchItems(1),
          url: '/categories/1/items.json',
        },
        {
          description: 'appends the queryString to the URL when provided',
          call: () => fetchItems(1, 'page=3'),
          url: '/categories/1/items.json?page=3',
        },
      ]);

      itResolvesWith([
        {
          description: 'returns the items array inside data',
          call: () => fetchItems(1),
          select: (result) => result.data,
          expected: data,
        },
        {
          description: 'returns pagination metadata',
          call: () => fetchItems(1),
          select: (result) => result.pagination,
          expected: { page: 2, pageSize: 5, pages: 4 },
        },
      ]);
    });

    itRejectsWithStatus({
      description: 'when the request fails',
      call: () => fetchItems(999),
      status: 404,
    });
  });

  describe('fetchItem', () => {
    describe('when the request succeeds', () => {
      const data = { id: 1, name: 'Laptop', price: 999 };

      mockFetchSuccess(data);

      itRequests([
        {
          description: 'fetches from /categories/:categoryId/items/:id.json',
          call: () => fetchItem(1, 1),
          url: '/categories/1/items/1.json',
        },
      ]);

      itResolvesWith([
        { description: 'returns the item', call: () => fetchItem(1, 1), expected: data },
      ]);
    });

    itRejectsWithStatus({
      description: 'when the request fails with 404',
      call: () => fetchItem(1, 999),
      status: 404,
    });
  });
});
