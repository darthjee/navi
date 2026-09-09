import { act, createElement } from 'react';
import ExtensionErrorBoundary from '../../src/extensions/ExtensionErrorBoundary.jsx';
import { useContainer } from '../support/dom.js';

const Healthy = () => createElement('div', { className: 'healthy' }, 'Healthy child');

const Broken = () => {
  throw new Error('extension render failure');
};

const render = async (root, child) => {
  await act(async () => {
    root.render(createElement(ExtensionErrorBoundary, null, createElement(child)));
  });
};

describe('ExtensionErrorBoundary', () => {
  const state = useContainer();

  describe('when the child renders normally', () => {
    beforeEach(async () => {
      await render(state.root, Healthy);
    });

    it('renders the child', () => {
      expect(state.container.textContent).toContain('Healthy child');
    });

    it('does not render the fallback alert', () => {
      expect(state.container.querySelector('.alert')).toBeNull();
    });
  });

  describe('when the child throws during render', () => {
    beforeEach(async () => {
      spyOn(console, 'warn');
      spyOn(console, 'error');
      await render(state.root, Broken);
    });

    it('renders an inline warning alert instead of a blank page', () => {
      const alert = state.container.querySelector('.alert.alert-warning');
      expect(alert).not.toBeNull();
      expect(alert.textContent).toContain('This extension page failed to load.');
    });

    it('warns about the thrown error', () => {
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
