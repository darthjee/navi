import { act } from 'react';
import { flushAsync } from './async.js';
import { mockFetchFailure, mockFetchSuccess } from './fetch.js';

// Registers the scenarios shared by the fetch-driven menus (MenuMenu and
// LinksMenu). Call at describe level. `render` is an async function without
// arguments that renders the component under test into the container held by
// `state` (from useContainer()). `dataKey` is the key of the fetched payload
// (`entries` or `links`), `label` the text on the toggle button and `items`
// the fetched entries (each with a `text` property). Pass `warns: true` when
// the component logs a warning on a failed fetch, so the console stays quiet.
const itBehavesLikeFetchedMenu = ({ state, render, label, dataKey, items, warns = false }) => {
  const renderAndFlush = async () => {
    await render();
    await flushAsync();
  };

  describe('when fetch returns no items', () => {
    mockFetchSuccess({ [dataKey]: [] });

    beforeEach(renderAndFlush);

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });

  describe('when fetch returns items', () => {
    mockFetchSuccess({ [dataKey]: items });

    beforeEach(renderAndFlush);

    it('renders a toggle button', () => {
      expect(state.container.querySelector('button')).not.toBeNull();
    });

    it(`shows "${label}" label on button`, () => {
      expect(state.container.querySelector('button').textContent).toContain(label);
    });

    it('does not show items before opening dropdown', () => {
      expect(state.container.querySelectorAll('a').length).toBe(0);
    });

    describe('when button is clicked', () => {
      beforeEach(async () => {
        await act(async () => {
          state.container.querySelector('button').click();
        });
      });

      it('shows all items', () => {
        expect(state.container.querySelectorAll('a').length).toBe(items.length);
      });

      it('renders the configured text', () => {
        items.forEach(({ text }) => {
          expect(state.container.textContent).toContain(text);
        });
      });
    });
  });

  describe('when fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(() => {
      if (warns) spyOn(console, 'warn');
    });

    beforeEach(renderAndFlush);

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });
};

const fixture = (name) => new URL(`fixtures/${name}`, import.meta.url).href;

// Successful and failed fetch responses, as accepted by renderMenuWithExtensions.
const jsonResponse = (body) => ({ ok: true, json: () => Promise.resolve(body) });
const failedResponse = (status) => ({ ok: false, status });

// Extensions manifest exposing the `Reports` route (/ext/reports).
const reportsManifest = () => jsonResponse({ bundles: [{ src: fixture('validReports.js') }] });

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

// Stubs fetch so `/menu.json` resolves to `menu` and `/extensions/frontend.json`
// to `manifest` (both are response objects; any other request is rejected),
// then renders the component with `render`, waits for it to settle and opens
// the dropdown. Call inside a `beforeEach`. Pass `warns: true` when the
// scenario is expected to log a warning, so the console stays quiet.
const renderMenuWithExtensions = async ({ state, render, menu, manifest, warns = false }) => {
  if (warns) spyOn(console, 'warn');
  spyOn(globalThis, 'fetch').and.callFake((url) => {
    if (url === '/menu.json') return Promise.resolve(menu);
    if (url === '/extensions/frontend.json') return Promise.resolve(manifest);
    return Promise.reject(new Error(`unexpected request: ${url}`));
  });
  await render();
  await flushAsync();
  await openMenu(state.container);
};

export {
  anchorTexts,
  failedResponse,
  itBehavesLikeFetchedMenu,
  jsonResponse,
  renderMenuWithExtensions,
  reportsManifest,
};
