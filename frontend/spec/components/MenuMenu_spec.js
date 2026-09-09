import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MenuMenu from '../../src/components/elements/MenuMenu.jsx';
import { resetExtensionsCache } from '../../src/extensions/loadExtensions.js';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const fixture = (name) => new URL(`../support/fixtures/${name}`, import.meta.url).href;

const jsonResponse = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

const anchorTexts = (container) =>
  Array.from(container.querySelectorAll('a')).map((a) => a.textContent);

const waitForButton = async (container) => {
  for (let i = 0; i < 50 && !container.querySelector('button'); i += 1) {
    await flushAsync();
  }
};

const openMenu = async (container) => {
  await waitForButton(container);
  await act(async () => {
    container.querySelector('button').click();
  });
};

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

  describe('when fetch returns no entries', () => {
    mockFetchSuccess({ entries: [] });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });

  describe('when fetch returns entries', () => {
    mockFetchSuccess({
      entries: [
        { text: 'Logs', route: '/logs' },
        { text: 'Docs', route: 'https://example.com/docs' },
      ],
    });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders a toggle button', () => {
      expect(state.container.querySelector('button')).not.toBeNull();
    });

    it('shows "Menu" label on button', () => {
      expect(state.container.querySelector('button').textContent).toContain('Menu');
    });

    it('does not show entries before opening dropdown', () => {
      expect(state.container.querySelectorAll('a').length).toBe(0);
    });

    describe('when button is clicked', () => {
      beforeEach(async () => {
        await act(async () => {
          state.container.querySelector('button').click();
        });
      });

      it('shows all entries', () => {
        expect(state.container.querySelectorAll('a').length).toBe(2);
      });

      it('renders the configured text', () => {
        expect(state.container.textContent).toContain('Logs');
        expect(state.container.textContent).toContain('Docs');
      });
    });
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

  describe('when fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });

  describe('merging extension routes', () => {
    const stubMenuAnd = (menu, manifest) => {
      spyOn(globalThis, 'fetch').and.callFake((url) => {
        if (url === '/menu.json') return jsonResponse(menu);
        if (url === '/extensions/frontend.json') return manifest();
        return Promise.reject(new Error(`unexpected request: ${url}`));
      });
    };

    describe('when an extension route is not already listed or hidden', () => {
      beforeEach(async () => {
        stubMenuAnd(
          { entries: [{ route: '/logs', text: 'Logs' }], hidden: [] },
          () => jsonResponse({ bundles: [{ src: fixture('validReports.js') }] }),
        );
        await renderMenu(state.root);
        await flushAsync();
        await openMenu(state.container);
      });

      it('appends the extension entry after the menu-file entries', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs', 'Reports']);
      });
    });

    describe('when the extension route is listed in hidden', () => {
      beforeEach(async () => {
        stubMenuAnd(
          { entries: [{ route: '/logs', text: 'Logs' }], hidden: ['/ext/reports'] },
          () => jsonResponse({ bundles: [{ src: fixture('validReports.js') }] }),
        );
        await renderMenu(state.root);
        await flushAsync();
        await openMenu(state.container);
      });

      it('omits the hidden extension route', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs']);
      });
    });

    describe('when the extension route already exists in the menu entries', () => {
      beforeEach(async () => {
        stubMenuAnd(
          {
            entries: [
              { route: '/logs', text: 'Logs' },
              { route: '/ext/reports', text: 'Reports (configured)' },
            ],
            hidden: [],
          },
          () => jsonResponse({ bundles: [{ src: fixture('validReports.js') }] }),
        );
        await renderMenu(state.root);
        await flushAsync();
        await openMenu(state.container);
      });

      it('does not duplicate the route', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs', 'Reports (configured)']);
      });
    });

    describe('when the extension manifest request fails', () => {
      beforeEach(async () => {
        spyOn(console, 'warn');
        stubMenuAnd(
          { entries: [{ route: '/logs', text: 'Logs' }], hidden: [] },
          () => Promise.resolve({ ok: false, status: 500 }),
        );
        await renderMenu(state.root);
        await flushAsync();
        await openMenu(state.container);
      });

      it('still renders the menu-file entries', () => {
        expect(anchorTexts(state.container)).toEqual(['Logs']);
      });
    });

    describe('when the menu request fails but extensions load', () => {
      beforeEach(async () => {
        spyOn(console, 'warn');
        spyOn(globalThis, 'fetch').and.callFake((url) => {
          if (url === '/menu.json') return Promise.resolve({ ok: false, status: 502 });
          if (url === '/extensions/frontend.json') {
            return jsonResponse({ bundles: [{ src: fixture('validReports.js') }] });
          }
          return Promise.reject(new Error(`unexpected request: ${url}`));
        });
        await renderMenu(state.root);
        await flushAsync();
        await openMenu(state.container);
      });

      it('still renders the extension entries', () => {
        expect(anchorTexts(state.container)).toEqual(['Reports']);
      });
    });
  });
});
