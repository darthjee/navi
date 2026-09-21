import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MenuMenu from '../../src/components/elements/MenuMenu.jsx';
import { resetExtensionsCache } from '../../src/extensions/loadExtensions.js';
import { useContainer } from '../support/dom.js';
import { flushAsync } from '../support/async.js';
import { mockFetchSuccess } from '../support/fetch.js';
import {
  anchorTexts,
  failedResponse,
  itBehavesLikeFetchedMenu,
  jsonResponse,
  renderMenuWithExtensions,
  reportsManifest,
} from '../support/fetched_menu.js';

const renderMenu = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(MenuMenu)));
  });
};

describe('MenuMenu', () => {
  const state = useContainer();

  beforeEach(() => {
    resetExtensionsCache();
  });

  const render = () => renderMenu(state.root);

  itBehavesLikeFetchedMenu({
    state,
    render,
    label: 'Menu',
    dataKey: 'entries',
    items: [
      { text: 'Logs', route: '/logs' },
      { text: 'Docs', route: 'https://example.com/docs' },
    ],
    warns: true,
  });

  describe('when fetch returns many entries', () => {
    const manyEntries = Array.from({ length: 25 }, (_, index) => ({
      text: `Entry ${index}`,
      route: `/entry-${index}`,
    }));

    mockFetchSuccess({ entries: manyEntries });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
      await act(async () => {
        state.container.querySelector('button').click();
      });
    });

    it('passes every entry through unchanged', () => {
      expect(state.container.querySelectorAll('a').length).toBe(manyEntries.length);
    });

    it('preserves the entry order', () => {
      const texts = Array.from(state.container.querySelectorAll('a')).map((a) => a.textContent);
      expect(texts).toEqual(manyEntries.map((entry) => entry.text));
    });
  });

  describe('merging extension routes', () => {
    const renderWith = (options) => renderMenuWithExtensions({ state, render, ...options });

    describe('when an extension route is not already listed or hidden', () => {
      beforeEach(() => renderWith({
        menu: jsonResponse({ entries: [{ route: '/logs', text: 'Logs' }], hidden: [] }),
        manifest: reportsManifest(),
      }));

      it('appends the extension entry after the menu-file entries', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs', 'Reports']);
      });
    });

    describe('when the extension route is listed in hidden', () => {
      beforeEach(() => renderWith({
        menu: jsonResponse({ entries: [{ route: '/logs', text: 'Logs' }], hidden: ['/ext/reports'] }),
        manifest: reportsManifest(),
      }));

      it('omits the hidden extension route', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs']);
      });
    });

    describe('when the extension route already exists in the menu entries', () => {
      beforeEach(() => renderWith({
        menu: jsonResponse({
          entries: [
            { route: '/logs', text: 'Logs' },
            { route: '/ext/reports', text: 'Reports (configured)' },
          ],
          hidden: [],
        }),
        manifest: reportsManifest(),
      }));

      it('does not duplicate the route', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs', 'Reports (configured)']);
      });
    });

    describe('when the extension manifest request fails', () => {
      beforeEach(() => renderWith({
        menu: jsonResponse({ entries: [{ route: '/logs', text: 'Logs' }], hidden: [] }),
        manifest: failedResponse(500),
        warns: true,
      }));

      it('still renders the menu-file entries', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs']);
      });
    });

    describe('when the menu request fails but extensions load', () => {
      beforeEach(() => renderWith({
        menu: failedResponse(502),
        manifest: reportsManifest(),
        warns: true,
      }));

      it('still renders the extension entries', () => {
        expect(anchorTexts(state.container)).toEqual(['Reports']);
      });
    });
  });
});
