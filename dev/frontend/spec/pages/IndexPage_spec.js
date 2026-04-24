import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import IndexPage from '../../src/pages/IndexPage.jsx';

describe('IndexPage', () => {
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

  const render = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(MemoryRouter, null, createElement(IndexPage)));
    });
  };

  describe('renders the index page', () => {
    beforeEach(async () => {
      await render();
    });

    it('shows a welcome heading', () => {
      expect(container.textContent).toContain('Welcome');
    });

    it('shows a link to categories', () => {
      const links = container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories');
    });
  });
});
