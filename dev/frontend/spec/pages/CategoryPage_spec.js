import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { mockFetchSuccess } from 'navi-spec-support/fetch.js';
import { createElement } from 'react';
import CategoryPage from '../../src/pages/CategoryPage.jsx';
import {
  itBehavesLikeErrorState,
  itBehavesLikeLoadingState,
  itRefetchesWhenTheIdChanges,
} from '../support/page_scenarios.js';
import createPageRenderer from '../support/render_page.js';

describe('CategoryPage', () => {
  const state = useContainer();
  const { render, navigate } = createPageRenderer(state, {
    route: '/categories/:id',
    element: createElement(CategoryPage),
    defaultPath: '/categories/1',
  });

  itBehavesLikeLoadingState({ state, render });

  describe('when data loads successfully', () => {
    mockFetchSuccess({ id: 1, name: 'Electronics' });

    beforeEach(async () => {
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('shows the category name', () => {
      expect(state.container.textContent).toContain('Electronics');
    });

    it('renders a link to items', () => {
      const links = state.container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories/1/items');
    });
  });

  itBehavesLikeErrorState({ state, render, status: 404 });

  itRefetchesWhenTheIdChanges({
    state,
    render,
    navigate,
    data: { id: 1, name: 'Electronics' },
    nextPath: '/categories/2',
  });
});
