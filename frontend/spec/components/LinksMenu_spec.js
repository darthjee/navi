import { createElement } from 'react';
import { act } from 'react';
import LinksMenu from '../../src/components/elements/LinksMenu.jsx';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderMenu = async (root) => {
  await act(async () => {
    root.render(createElement(LinksMenu));
  });
};

describe('LinksMenu', () => {
  const state = useContainer();

  describe('when fetch returns no links', () => {
    mockFetchSuccess({ links: [] });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });

  describe('when fetch returns links', () => {
    mockFetchSuccess({
      links: [
        { text: 'Home', url: 'https://example.com' },
        { text: 'Docs', url: 'https://example.com/docs' },
      ],
    });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders a toggle button', () => {
      expect(state.container.querySelector('button')).not.toBeNull();
    });

    it('shows "Links" label on button', () => {
      expect(state.container.querySelector('button').textContent).toContain('Links');
    });

    it('does not show links before opening dropdown', () => {
      expect(state.container.querySelectorAll('a').length).toBe(0);
    });

    describe('when button is clicked', () => {
      beforeEach(async () => {
        await act(async () => {
          state.container.querySelector('button').click();
        });
      });

      it('shows all links', () => {
        expect(state.container.querySelectorAll('a').length).toBe(2);
      });

      it('renders the configured text', () => {
        expect(state.container.textContent).toContain('Home');
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
