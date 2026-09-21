import { mockFetchSuccess, paginationHeaders } from 'navi-spec-support/fetch.js';
import { fetchCategories, fetchCategory } from '../../src/clients/CategoriesClient.js';
import { itRejectsWithStatus, itRequests, itResolvesWith } from '../support/client_scenarios.js';

describe('CategoriesClient', () => {
  describe('fetchCategories', () => {
    describe('when the request succeeds', () => {
      const data = [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }];

      mockFetchSuccess(data, paginationHeaders({ page: 1, pageSize: 10, pages: 3 }));

      itRequests([
        {
          description: 'fetches from /categories.json',
          call: () => fetchCategories(),
          url: '/categories.json',
        },
        {
          description: 'appends the queryString to the URL when provided',
          call: () => fetchCategories('page=2'),
          url: '/categories.json?page=2',
        },
      ]);

      itResolvesWith([
        {
          description: 'returns the categories array inside data',
          call: () => fetchCategories(),
          select: (result) => result.data,
          expected: data,
        },
        {
          description: 'returns pagination metadata',
          call: () => fetchCategories(),
          select: (result) => result.pagination,
          expected: { page: 1, pageSize: 10, pages: 3 },
        },
      ]);
    });

    itRejectsWithStatus({
      description: 'when the request fails',
      call: () => fetchCategories(),
      status: 500,
    });
  });

  describe('fetchCategory', () => {
    describe('when the request succeeds', () => {
      const data = { id: 1, name: 'Electronics' };

      mockFetchSuccess(data);

      itRequests([
        {
          description: 'fetches from /categories/:id.json',
          call: () => fetchCategory(1),
          url: '/categories/1.json',
        },
      ]);

      itResolvesWith([
        { description: 'returns the category', call: () => fetchCategory(1), expected: data },
      ]);
    });

    itRejectsWithStatus({
      description: 'when the request fails with 404',
      call: () => fetchCategory(999),
      status: 404,
    });
  });
});
