import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import BaseUrlsMenu from '../../src/components/elements/BaseUrlsMenu.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderMenu = (root) => {
  root.render(createElement(BaseUrlsMenu));
};

describe('BaseUrlsMenu', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  describe('when fetch returns no base URLs', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ base_urls: [] }) }),
      );
      await act(async () => {
        root = createRoot(container);
        renderMenu(root);
      });
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(container.textContent).toBe('');
    });
  });

  describe('when fetch returns a single base URL', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ base_urls: ['https://example.com'] }) }),
      );
      await act(async () => {
        root = createRoot(container);
        renderMenu(root);
      });
      await flushAsync();
    });

    it('renders a single link', () => {
      const link = container.querySelector('a');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('https://example.com');
    });

    it('shows the URL as link text', () => {
      expect(container.textContent).toContain('https://example.com');
    });

    it('does not render a dropdown button', () => {
      expect(container.querySelector('button')).toBeNull();
    });
  });

  describe('when fetch returns multiple base URLs', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({
          ok:   true,
          json: () => Promise.resolve({ base_urls: ['https://a.com', 'https://b.com'] }),
        }),
      );
      await act(async () => {
        root = createRoot(container);
        renderMenu(root);
      });
      await flushAsync();
    });

    it('renders a toggle button', () => {
      expect(container.querySelector('button')).not.toBeNull();
    });

    it('shows "Base URLs" label on the button', () => {
      expect(container.querySelector('button').textContent).toContain('Base URLs');
    });

    it('does not show the dropdown initially', () => {
      const links = container.querySelectorAll('a');
      expect(links.length).toBe(0);
    });

    describe('when the button is clicked', () => {
      beforeEach(async () => {
        await act(async () => {
          container.querySelector('button').click();
        });
      });

      it('shows links for all base URLs', () => {
        const links = container.querySelectorAll('a');
        expect(links.length).toBe(2);
      });

      it('links to the first base URL', () => {
        const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('https://a.com');
      });

      it('links to the second base URL', () => {
        const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('https://b.com');
      });

      describe('when the button is clicked again', () => {
        beforeEach(async () => {
          await act(async () => {
            container.querySelector('button').click();
          });
        });

        it('hides the dropdown', () => {
          expect(container.querySelectorAll('a').length).toBe(0);
        });
      });
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 }),
      );
      await act(async () => {
        root = createRoot(container);
        renderMenu(root);
      });
      await flushAsync();
    });

    it('renders nothing', () => {
      expect(container.textContent).toBe('');
    });
  });
});
