import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { mockFetchSuccess } from 'navi-spec-support/fetch.js';
import { createElement } from 'react';
import CategoryItemPage from '../../src/pages/CategoryItemPage.jsx';
import {
  itBehavesLikeErrorState,
  itBehavesLikeLoadingState,
  itRefetchesWhenTheIdChanges,
} from '../support/page_scenarios.js';
import createPageRenderer from '../support/render_page.js';

describe('CategoryItemPage', () => {
  const state = useContainer();
  const { render, navigate } = createPageRenderer(state, {
    route: '/categories/:categoryId/items/:id',
    element: createElement(CategoryItemPage),
    defaultPath: '/categories/1/items/1',
  });

  itBehavesLikeLoadingState({ state, render });

  describe('when data loads successfully', () => {
    mockFetchSuccess({ id: 1, name: 'Laptop' });

    beforeEach(async () => {
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('shows the item name', () => {
      expect(state.container.textContent).toContain('Laptop');
    });
  });

  itBehavesLikeErrorState({ state, render, status: 404 });

  itRefetchesWhenTheIdChanges({
    state,
    render,
    navigate,
    data: { id: 1, name: 'Laptop' },
    nextPath: '/categories/1/items/2',
  });
});
