import { flushAsync } from 'navi-spec-support/async.js';
import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import noop from 'navi-spec-support/noop.js';
import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import CategoryItemPage from '../../src/pages/CategoryItemPage.jsx';

describe('CategoryItemPage', () => {
  const state = useContainer();
  let navigate;

  const NavigationCapture = () => {
    navigate = useNavigate();
    return null;
  };

  const render = async () => {
    await renderInAct(
      state.root,
      createElement(MemoryRouter, { initialEntries: ['/categories/1/items/1'] },
        createElement(NavigationCapture),
        createElement(Routes, null,
          createElement(Route, { path: '/categories/:categoryId/items/:id', element: createElement(CategoryItemPage) })
        )
      )
    );
  };

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await render();
    });

    it('shows a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
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
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('shows the item name', () => {
      expect(state.container.textContent).toContain('Laptop');
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
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('displays the error message', () => {
      expect(state.container.textContent).toContain('HTTP 404');
    });
  });

  describe('when the id changes', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1, name: 'Laptop' }) })
      );
      await render();
      await flushAsync();
      globalThis.fetch.and.returnValue(new Promise(noop));
      await act(async () => { navigate('/categories/1/items/2'); });
    });

    it('shows the spinner again while the new fetch is pending', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });
  });
});
