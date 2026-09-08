import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MenuMenu from '../../src/components/elements/MenuMenu.jsx';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderMenu = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(MenuMenu)));
  });
};

describe('MenuMenu', () => {
  const state = useContainer();

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
});
