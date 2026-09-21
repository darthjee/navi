import { flushAsync } from 'navi-spec-support/async.js';
import {
  mockFetchFailure,
  mockFetchPending,
  paginationHeaders,
  stubFetchSuccess,
} from 'navi-spec-support/fetch.js';
import noop from 'navi-spec-support/noop.js';

// Shared scenarios for the page specs. Every function must be called at
// describe level. `state` is the object returned by `useContainer()` and
// `render` the async function returned by `createPageRenderer` (see render_page.js).

// "while loading": the fetch never resolves and a spinner is shown.
const itBehavesLikeLoadingState = ({ state, render }) => {
  describe('while loading', () => {
    mockFetchPending();

    beforeEach(async () => {
      await render();
    });

    it('shows a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });
  });
};

// "when the fetch fails": the fetch answers with HTTP `status` and an error alert is shown.
const itBehavesLikeErrorState = ({ state, render, status }) => {
  describe('when the fetch fails', () => {
    mockFetchFailure(status);

    beforeEach(async () => {
      await render();
      await flushAsync();
    });

    it('shows an error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('displays the error message', () => {
      expect(state.container.textContent).toContain(`HTTP ${status}`);
    });
  });
};

// "when the id changes": after the page has loaded `data`, navigating to
// `nextPath` triggers a new (pending) fetch and the spinner shows again.
const itRefetchesWhenTheIdChanges = ({ state, render, navigate, data, nextPath }) => {
  describe('when the id changes', () => {
    beforeEach(async () => {
      stubFetchSuccess(data);
      await render();
      await flushAsync();
      globalThis.fetch.and.returnValue(new Promise(noop));
      await navigate(nextPath);
    });

    it('shows the spinner again while the new fetch is pending', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });
  });
};

// "when data loads with multiple pages": `headers` are the pagination options
// (`{ page, pageSize, pages }`) given to `paginationHeaders`; the page is
// rendered at `path` and `activePage` is expected to be the active page item.
const itBehavesLikePaginatedIndex = ({ state, render, data, headers, path, activePage }) => {
  describe('when data loads with multiple pages', () => {
    beforeEach(async () => {
      stubFetchSuccess(data, paginationHeaders(headers));
      await render(path);
      await flushAsync();
    });

    it('renders pagination', () => {
      expect(state.container.querySelector('.pagination')).not.toBeNull();
    });

    it('marks the current page as active', () => {
      const activeItem = state.container.querySelector('.page-item.active');
      expect(activeItem).not.toBeNull();
      expect(activeItem.textContent).toContain(String(activePage));
    });
  });
};

export {
  itBehavesLikeErrorState,
  itBehavesLikeLoadingState,
  itBehavesLikePaginatedIndex,
  itRefetchesWhenTheIdChanges,
};
