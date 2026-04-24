import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CategoryItemPage from '../../src/pages/CategoryItemPage.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('CategoryItemPage', () => {
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

  const render = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        createElement(MemoryRouter, { initialEntries: ['/categories/1/items/1'] },
          createElement(Routes, null,
            createElement(Route, { path: '/categories/:categoryId/items/:id', element: createElement(CategoryItemPage) })
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
    const item = { id: 1, name: 'Laptop' };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve(item) })
      );
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('shows the item name', () => {
      expect(container.textContent).toContain('Laptop');
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
