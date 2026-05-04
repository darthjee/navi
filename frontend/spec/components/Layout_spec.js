import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../../src/components/pages/Layout.jsx';
import noop from '../../src/utils/noop.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderLayout = async (root, { children = null } = {}) => {
  await act(async () => {
    root.render(
      createElement(MemoryRouter, null,
        createElement(Routes, null,
          createElement(Route, { path: '/', element: createElement(Layout) },
            children ? createElement(Route, { index: true, element: children }) : null
          )
        )
      )
    );
  });
};

describe('Layout', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  describe('always', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await renderLayout(root);
    });

    it('renders the Navi title', () => {
      expect(container.textContent).toContain('Navi — Cache Warmer');
    });

    it('renders an h1 heading', () => {
      const h1 = container.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toContain('Navi — Cache Warmer');
    });
  });

  describe('when stats load successfully', () => {
    const stats = {
      workers: { idle: 2, busy: 0 },
      jobs: { enqueued: 1, processing: 0, failed: 0, finished: 5, dead: 0 },
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve(stats) })
      );
      await renderLayout(root);
      await flushAsync();
    });

    it('renders the Workers section in the header', () => {
      expect(container.textContent).toContain('Workers');
    });

    it('renders the Jobs section in the header', () => {
      expect(container.textContent).toContain('Jobs');
    });
  });

  describe('with page-specific content', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      const pageContent = createElement('div', { className: 'page-content' }, 'Page Content');
      await renderLayout(root, { children: pageContent });
    });

    it('renders the outlet content', () => {
      expect(container.textContent).toContain('Page Content');
    });

    it('renders the title alongside the page content', () => {
      expect(container.textContent).toContain('Navi — Cache Warmer');
      expect(container.textContent).toContain('Page Content');
    });
  });
});
