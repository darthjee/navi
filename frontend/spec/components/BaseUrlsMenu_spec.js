import { createElement } from 'react';
import { act } from 'react';
import BaseUrlsMenu from '../../src/components/elements/BaseUrlsMenu.jsx';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderMenu = async (root) => {
  await act(async () => {
    root.render(createElement(BaseUrlsMenu));
  });
};

describe('BaseUrlsMenu', () => {
  const state = useContainer();

  describe('when fetch returns no base URLs', () => {
    mockFetchSuccess({ base_urls: [] });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });

  describe('when fetch returns a single base URL', () => {
    mockFetchSuccess({ base_urls: ['https://example.com'] });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders a single link', () => {
      const link = state.container.querySelector('a');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('https://example.com');
    });

    it('shows the URL as link text', () => {
      expect(state.container.textContent).toContain('https://example.com');
    });

    it('does not render a dropdown button', () => {
      expect(state.container.querySelector('button')).toBeNull();
    });
  });

  describe('when fetch returns multiple base URLs', () => {
    mockFetchSuccess({ base_urls: ['https://a.com', 'https://b.com'] });

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders a toggle button', () => {
      expect(state.container.querySelector('button')).not.toBeNull();
    });

    it('shows "Base URLs" label on the button', () => {
      expect(state.container.querySelector('button').textContent).toContain('Base URLs');
    });

    it('does not show the dropdown initially', () => {
      const links = state.container.querySelectorAll('a');
      expect(links.length).toBe(0);
    });

    describe('when the button is clicked', () => {
      beforeEach(async () => {
        await act(async () => {
          state.container.querySelector('button').click();
        });
      });

      it('shows links for all base URLs', () => {
        const links = state.container.querySelectorAll('a');
        expect(links.length).toBe(2);
      });

      it('links to the first base URL', () => {
        const hrefs = Array.from(state.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('https://a.com');
      });

      it('links to the second base URL', () => {
        const hrefs = Array.from(state.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('https://b.com');
      });

      describe('when the button is clicked again', () => {
        beforeEach(async () => {
          await act(async () => {
            state.container.querySelector('button').click();
          });
        });

        it('hides the dropdown', () => {
          expect(state.container.querySelectorAll('a').length).toBe(0);
        });
      });
    });
  });

  describe('when the fetch fails', () => {
    mockFetchFailure(500);

    beforeEach(async () => {
      await renderMenu(state.root);
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(state.container.textContent).toBe('');
    });
  });
});
