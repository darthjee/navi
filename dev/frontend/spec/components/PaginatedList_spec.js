import { flushAsync } from 'navi-spec-support/async.js';
import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import noop from 'navi-spec-support/noop.js';
import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import PaginatedList from '../../src/components/PaginatedList.jsx';

describe('PaginatedList', () => {
  const state = useContainer();
  let navigate;
  let fetchPage;

  const items = [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
  ];

  const NavigationCapture = () => {
    navigate = useNavigate();
    return null;
  };

  const render = async (initialEntry = '/things', props = {}) => {
    await renderInAct(
      state.root,
      createElement(MemoryRouter, { initialEntries: [initialEntry] },
        createElement(NavigationCapture),
        createElement(PaginatedList, {
          title: 'Things',
          fetchPage,
          itemPath: (item) => `/things/${item.id}`,
          basePath: '/#/things',
          ...props,
        })
      )
    );
  };

  describe('while loading', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(new Promise(noop));
      await render();
    });

    it('shows a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(Promise.reject(new Error('HTTP 500')));
      await render();
      await flushAsync();
    });

    it('shows an error alert with the message', () => {
      expect(state.container.querySelector('.alert-danger').textContent).toBe('HTTP 500');
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });
  });

  describe('when data loads successfully', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(
        Promise.resolve({ data: items, pagination: { page: 1, pages: 1 } })
      );
      await render();
      await flushAsync();
    });

    it('renders the title', () => {
      expect(state.container.querySelector('h1').textContent).toBe('Things');
    });

    it('renders one list item per resource', () => {
      expect(state.container.querySelectorAll('.list-group-item').length).toBe(2);
    });

    it('links each item using itemPath', () => {
      const hrefs = Array.from(state.container.querySelectorAll('.list-group-item a'))
        .map((a) => a.getAttribute('href'));
      expect(hrefs).toEqual(['/things/1', '/things/2']);
    });

    it('does not render pagination when there is a single page', () => {
      expect(state.container.querySelector('.pagination')).toBeNull();
    });

    it('forwards an empty query string to fetchPage', () => {
      expect(fetchPage).toHaveBeenCalledWith('');
    });
  });

  describe('when there are multiple pages', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(
        Promise.resolve({ data: items, pagination: { page: 2, pages: 3 } })
      );
      await render();
      await flushAsync();
    });

    it('renders pagination', () => {
      expect(state.container.querySelector('.pagination')).not.toBeNull();
    });

    it('marks the current page as active', () => {
      expect(state.container.querySelector('.page-item.active').textContent).toContain('2');
    });

    it('builds pagination links using basePath', () => {
      const hrefs = Array.from(state.container.querySelectorAll('a.page-link'))
        .map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/#/things?page=3');
    });
  });

  describe('when there is no pagination info', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(
        Promise.resolve({ data: items, pagination: null })
      );
      await render();
      await flushAsync();
    });

    it('does not render pagination', () => {
      expect(state.container.querySelector('.pagination')).toBeNull();
    });
  });

  describe('when the location has a query string', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(
        Promise.resolve({ data: items, pagination: { page: 2, pages: 3 } })
      );
      await render('/things?page=2');
      await flushAsync();
    });

    it('forwards the query string without the leading question mark', () => {
      expect(fetchPage).toHaveBeenCalledWith('page=2');
    });
  });

  describe('when the search changes', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(
        Promise.resolve({ data: items, pagination: { page: 1, pages: 3 } })
      );
      await render();
      await flushAsync();
      await act(async () => { navigate('/things?page=3'); });
      await flushAsync();
    });

    it('refetches with the new query string', () => {
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(fetchPage).toHaveBeenCalledWith('page=3');
    });
  });

  describe('when resourceId changes', () => {
    beforeEach(async () => {
      fetchPage = jasmine.createSpy('fetchPage').and.returnValue(
        Promise.resolve({ data: items, pagination: { page: 1, pages: 1 } })
      );
      await render('/things', { resourceId: 1 });
      await flushAsync();
      await renderInAct(
        state.root,
        createElement(MemoryRouter, { initialEntries: ['/things'] },
          createElement(PaginatedList, {
            title: 'Things',
            fetchPage,
            itemPath: (item) => `/things/${item.id}`,
            basePath: '/#/things',
            resourceId: 2,
          })
        )
      );
      await flushAsync();
    });

    it('refetches', () => {
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });
  });
});
