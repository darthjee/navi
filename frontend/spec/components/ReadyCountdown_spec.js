import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ReadyCountdown from '../../src/components/ReadyCountdown.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const render = async (root, props) => {
  await act(async () => {
    root.render(createElement(ReadyCountdown, props));
  });
};

describe('ReadyCountdown', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  describe('when readyInMs is 0', () => {
    beforeEach(async () => {
      await render(root, { readyInMs: 0 });
      await flushAsync();
    });

    it('shows Ready', () => {
      expect(container.textContent).toContain('Ready');
    });

    it('applies the success CSS class', () => {
      expect(container.querySelector('.text-success')).not.toBeNull();
    });
  });

  describe('when readyInMs is negative', () => {
    beforeEach(async () => {
      await render(root, { readyInMs: -500 });
      await flushAsync();
    });

    it('shows Ready', () => {
      expect(container.textContent).toContain('Ready');
    });
  });

  describe('when readyInMs is a positive value', () => {
    beforeEach(async () => {
      await render(root, { readyInMs: 5000 });
      await flushAsync();
    });

    it('shows a countdown in seconds', () => {
      expect(container.textContent).toContain('5s');
    });

    it('does not show Ready', () => {
      expect(container.textContent).not.toContain('Ready');
    });
  });

  describe('when readyInMs is not a multiple of 1000', () => {
    beforeEach(async () => {
      await render(root, { readyInMs: 3500 });
      await flushAsync();
    });

    it('rounds up to the nearest second', () => {
      expect(container.textContent).toContain('4s');
    });
  });
});
