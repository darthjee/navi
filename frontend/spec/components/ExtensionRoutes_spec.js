import { act, createElement } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../../src/components/pages/Layout.jsx';
import ExtensionErrorBoundary from '../../src/extensions/ExtensionErrorBoundary.jsx';
import { resetExtensionsCache } from '../../src/extensions/loadExtensions.js';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const Reports = () => createElement('div', { className: 'ext-reports' }, 'Reports Page');

const Boom = () => {
  throw new Error('extension render failure');
};

// Mirrors the nested <Route> tree that src/main.jsx builds, including the
// `extensionRoutes.length > 0` guard so this doubles as a regression check.
const buildExtensionRoutes = (extensionRoutes) => {
  if (extensionRoutes.length === 0) return null;

  return createElement(
    Route,
    { element: createElement(ExtensionErrorBoundary) },
    extensionRoutes.map(({ path, component: C }) =>
      createElement(Route, { key: path, path: path.replace(/^\//, ''), element: createElement(C) })),
  );
};

const buildTree = (extensionRoutes, initialPath) =>
  createElement(
    MemoryRouter,
    { initialEntries: [initialPath] },
    createElement(
      Routes,
      null,
      createElement(
        Route,
        { path: '/', element: createElement(Layout) },
        createElement(Route, { index: true, element: createElement(Navigate, { to: '/logs', replace: true }) }),
        createElement(Route, { path: 'logs', element: createElement('div', { className: 'stock-logs' }, 'Stock Logs Page') }),
        buildExtensionRoutes(extensionRoutes),
      ),
    ),
  );

const renderTree = async (root, extensionRoutes, initialPath) => {
  await act(async () => {
    root.render(buildTree(extensionRoutes, initialPath));
  });
  await flushAsync();
};

describe('extension routes integration', () => {
  const state = useContainer();

  beforeEach(() => {
    resetExtensionsCache();
    spyOn(globalThis, 'fetch').and.callFake((url) => {
      if (url === '/extensions/frontend.json') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ bundles: [] }) });
      }
      return new Promise(noop);
    });
  });

  describe('with a registered extension route', () => {
    const routes = [{ path: '/ext/reports', text: 'Reports', component: Reports }];

    it('renders the extension page inside the stock layout', async () => {
      await renderTree(state.root, routes, '/ext/reports');
      expect(state.container.textContent).toContain('Reports Page');
      expect(state.container.textContent).toContain('Navi — Cache Warmer');
    });

    it('still renders the stock routes unchanged', async () => {
      await renderTree(state.root, routes, '/logs');
      expect(state.container.textContent).toContain('Stock Logs Page');
      expect(state.container.textContent).not.toContain('Reports Page');
    });
  });

  describe('with no extension routes', () => {
    it('renders the stock-only tree', async () => {
      await renderTree(state.root, [], '/logs');
      expect(state.container.textContent).toContain('Stock Logs Page');
    });
  });

  describe('when an extension component throws on render', () => {
    const routes = [{ path: '/ext/boom', text: 'Boom', component: Boom }];

    beforeEach(() => {
      spyOn(console, 'warn');
      spyOn(console, 'error');
    });

    it('shows the inline boundary alert without blanking the layout', async () => {
      await renderTree(state.root, routes, '/ext/boom');
      expect(state.container.textContent).toContain('This extension page failed to load.');
      expect(state.container.textContent).toContain('Navi — Cache Warmer');
    });
  });
});
