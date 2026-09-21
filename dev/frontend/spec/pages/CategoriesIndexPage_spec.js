import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { mockFetchSuccess, paginationHeaders } from 'navi-spec-support/fetch.js';
import { createElement } from 'react';
import CategoriesIndexPage from '../../src/pages/CategoriesIndexPage.jsx';
import {
  itBehavesLikeErrorState,
  itBehavesLikeLoadingState,
  itBehavesLikePaginatedIndex,
} from '../support/page_scenarios.js';
import createPageRenderer from '../support/render_page.js';

describe('CategoriesIndexPage', () => {
  const state = useContainer();
  const { render } = createPageRenderer(state, {
    element: createElement(CategoriesIndexPage),
    defaultPath: '/categories',
  });

  itBehavesLikeLoadingState({ state, render });

  describe('when data loads successfully', () => {
    mockFetchSuccess(
      [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Books' },
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

    it('renders all category names', () => {
      const text = state.container.textContent;
      expect(text).toContain('Electronics');
      expect(text).toContain('Books');
    });

    it('renders links to each category', () => {
      const links = state.container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories/1');
      expect(hrefs).toContain('/categories/2');
    });

    it('does not render pagination when there is only 1 page', () => {
      expect(state.container.querySelector('.pagination')).toBeNull();
    });
  });

  itBehavesLikePaginatedIndex({
    state,
    render,
    data: [{ id: 1, name: 'Electronics' }],
    headers: { page: 2, pageSize: 1, pages: 5 },
    path: '/categories?page=2',
    activePage: 2,
  });

  itBehavesLikeErrorState({ state, render, status: 500 });
});
