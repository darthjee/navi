import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import IndexPage from '../../src/pages/IndexPage.jsx';

describe('IndexPage', () => {
  const state = useContainer();

  const render = async () => {
    await renderInAct(state.root, createElement(MemoryRouter, null, createElement(IndexPage)));
  };

  describe('renders the index page', () => {
    beforeEach(async () => {
      await render();
    });

    it('shows a welcome heading', () => {
      expect(state.container.textContent).toContain('Welcome');
    });

    it('shows a link to categories', () => {
      const links = state.container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories');
    });
  });
});
