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

export { itBehavesLikeFetchedMenu };
