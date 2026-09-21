import { flushAsync } from 'navi-spec-support/async.js';
import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import noop from 'navi-spec-support/noop.js';
import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import CategoryPage from '../../src/pages/CategoryPage.jsx';

describe('CategoryPage', () => {
  const state = useContainer();
  let navigate;

  const NavigationCapture = () => {
    navigate = useNavigate();
    return null;
  };

  const render = async () => {
    await renderInAct(
      state.root,
      createElement(MemoryRouter, { initialEntries: ['/categories/1'] },
        createElement(NavigationCapture),
        createElement(Routes, null,
          createElement(Route, { path: '/categories/:id', element: createElement(CategoryPage) })
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
    const category = { id: 1, name: 'Electronics' };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve(category) })
      );
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
        Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1, name: 'Electronics' }) })
      );
      await render();
      await flushAsync();
      globalThis.fetch.and.returnValue(new Promise(noop));
      await act(async () => { navigate('/categories/2'); });
    });

    it('shows the spinner again while the new fetch is pending', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });
  });
});
