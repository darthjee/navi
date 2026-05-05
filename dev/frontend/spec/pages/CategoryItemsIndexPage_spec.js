import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CategoryItemsIndexPage from '../../src/pages/CategoryItemsIndexPage.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const makeFetchResponse = (data, paginationHeaders = {}) => {
  const headers = new Headers({
    PAGE: String(paginationHeaders.page || 1),
    'PAGE-SIZE': String(paginationHeaders.pageSize || 10),
    PAGES: String(paginationHeaders.pages || 1),
  });
  return Promise.resolve({ ok: true, headers, json: () => Promise.resolve(data) });
};

describe('CategoryItemsIndexPage', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  const render = async (initialEntry = '/categories/1/items') => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(MemoryRouter, { initialEntries: [initialEntry] },
          createElement(Routes, null,
            createElement(Route, { path: '/categories/:id/items', element: createElement(CategoryItemsIndexPage) })
          )
        )
      );
    });
  };

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}));
      await render();
    });

    it('shows a spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });
  });

  describe('when data loads successfully', () => {
    const items = [
      { id: 1, name: 'Laptop' },
      { id: 2, name: 'Phone' },
    ];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(makeFetchResponse(items));
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders all item names', () => {
      const text = container.textContent;
      expect(text).toContain('Laptop');
      expect(text).toContain('Phone');
    });

    it('renders links to each item', () => {
      const links = container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories/1/items/1');
      expect(hrefs).toContain('/categories/1/items/2');
    });

    it('does not render pagination when there is only 1 page', () => {
      expect(container.querySelector('.pagination')).toBeNull();
    });
  });

  describe('when data loads with multiple pages', () => {
    const items = [{ id: 1, name: 'Laptop' }];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        makeFetchResponse(items, { page: 3, pageSize: 1, pages: 7 })
      );
      await render('/categories/1/items?page=3');
      await flushAsync();
    });

    it('renders pagination', () => {
      expect(container.querySelector('.pagination')).not.toBeNull();
    });

    it('marks the current page as active', () => {
      const activeItem = container.querySelector('.page-item.active');
      expect(activeItem).not.toBeNull();
      expect(activeItem.textContent).toContain('3');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 404 })
      );
      await render();
      await flushAsync();
    });

    it('shows an error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('displays the error message', () => {
      expect(container.textContent).toContain('HTTP 404');
    });
  });
});
