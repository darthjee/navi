import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

const renderApp = (root) => {
  root.render(createElement(MemoryRouter, null, createElement(App)));
};

describe('App', () => {
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

  describe('when rendered', () => {
    beforeEach(async () => {
      await act(async () => {
        root = createRoot(container);
        renderApp(root);
      });
    });

    it('renders nothing', () => {
      expect(container.textContent).toBe('');
    });
  });
});
