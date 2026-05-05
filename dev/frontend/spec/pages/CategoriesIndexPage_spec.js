import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CategoriesIndexPage from '../../src/pages/CategoriesIndexPage.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const makeFetchResponse = (data, paginationHeaders = {}) => {
  const headers = new Headers({
    PAGE: String(paginationHeaders.page || 1),
    'PAGE-SIZE': String(paginationHeaders.pageSize || 10),
    PAGES: String(paginationHeaders.pages || 1),
  });
  return Promise.resolve({ ok: true, headers, json: () => Promise.resolve(data) });
};

describe('CategoriesIndexPage', () => {
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

  const render = async (initialEntry = '/categories') => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(MemoryRouter, { initialEntries: [initialEntry] }, createElement(CategoriesIndexPage)));
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
    const categories = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Books' },
    ];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(makeFetchResponse(categories));
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders all category names', () => {
      const text = container.textContent;
      expect(text).toContain('Electronics');
      expect(text).toContain('Books');
    });

    it('renders links to each category', () => {
      const links = container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories/1');
      expect(hrefs).toContain('/categories/2');
    });

    it('does not render pagination when there is only 1 page', () => {
      expect(container.querySelector('.pagination')).toBeNull();
    });
  });

  describe('when data loads with multiple pages', () => {
    const categories = [{ id: 1, name: 'Electronics' }];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        makeFetchResponse(categories, { page: 2, pageSize: 1, pages: 5 })
      );
      await render('/categories?page=2');
      await flushAsync();
    });

    it('renders pagination', () => {
      expect(container.querySelector('.pagination')).not.toBeNull();
    });

    it('marks the current page as active', () => {
      const activeItem = container.querySelector('.page-item.active');
      expect(activeItem).not.toBeNull();
      expect(activeItem.textContent).toContain('2');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 })
      );
      await render();
      await flushAsync();
    });

    it('shows an error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('displays the error message', () => {
      expect(container.textContent).toContain('HTTP 500');
    });
  });
});
