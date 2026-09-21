import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { mockFetchSuccess, paginationHeaders } from 'navi-spec-support/fetch.js';
import { createElement } from 'react';
import CategoryItemsIndexPage from '../../src/pages/CategoryItemsIndexPage.jsx';
import {
  itBehavesLikeErrorState,
  itBehavesLikeLoadingState,
  itBehavesLikePaginatedIndex,
} from '../support/page_scenarios.js';
import createPageRenderer from '../support/render_page.js';

describe('CategoryItemsIndexPage', () => {
  const state = useContainer();
  const { render } = createPageRenderer(state, {
    route: '/categories/:id/items',
    element: createElement(CategoryItemsIndexPage),
    defaultPath: '/categories/1/items',
  });

  itBehavesLikeLoadingState({ state, render });

  describe('when data loads successfully', () => {
    mockFetchSuccess(
      [
        { id: 1, name: 'Laptop' },
        { id: 2, name: 'Phone' },
      ],
      paginationHeaders()
    );

    beforeEach(async () => {
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders all item names', () => {
      const text = state.container.textContent;
      expect(text).toContain('Laptop');
      expect(text).toContain('Phone');
    });

    it('renders links to each item', () => {
      const links = state.container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories/1/items/1');
      expect(hrefs).toContain('/categories/1/items/2');
    });

    it('does not render pagination when there is only 1 page', () => {
      expect(state.container.querySelector('.pagination')).toBeNull();
    });
  });

  itBehavesLikePaginatedIndex({
    state,
    render,
    data: [{ id: 1, name: 'Laptop' }],
    headers: { page: 3, pageSize: 1, pages: 7 },
    path: '/categories/1/items?page=3',
    activePage: 3,
  });

  itBehavesLikeErrorState({ state, render, status: 404 });
});
