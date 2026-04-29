import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import EngineControls from '../../src/components/EngineControls.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderControls = async (root) => {
  await act(async () => {
    root.render(createElement(EngineControls));
  });
};

const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text);

describe('EngineControls', () => {
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

  describe('when engine is running', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'running' }) })
      );
      await renderControls(root);
      await flushAsync();
    });

    it('renders the Engine label', () => {
      expect(container.textContent).toContain('Engine');
    });

    it('renders the Pause button enabled', () => {
      const button = findButtonByText(container, 'Pause');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeFalse();
    });

    it('renders the Stop button enabled', () => {
      const button = findButtonByText(container, 'Stop');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeFalse();
    });

    it('renders the Restart button enabled', () => {
      const button = findButtonByText(container, 'Restart');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeFalse();
    });

    it('renders the Continue button disabled', () => {
      const button = findButtonByText(container, 'Continue');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeTrue();
    });

    it('renders the Start button disabled', () => {
      const button = findButtonByText(container, 'Start');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeTrue();
    });
  });

  describe('when engine is paused', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'paused' }) })
      );
      await renderControls(root);
      await flushAsync();
    });

    it('renders the Pause button disabled', () => {
      const button = findButtonByText(container, 'Pause');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeTrue();
    });

    it('renders the Continue button enabled', () => {
      const button = findButtonByText(container, 'Continue');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeFalse();
    });
  });

  describe('when engine is stopped', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'stopped' }) })
      );
      await renderControls(root);
      await flushAsync();
    });

    it('renders the Start button enabled', () => {
      const button = findButtonByText(container, 'Start');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeFalse();
    });

    it('renders the Pause button disabled', () => {
      const button = findButtonByText(container, 'Pause');
      expect(button).not.toBeNull();
      expect(button.disabled).toBeTrue();
    });
  });

  describe('when engine is transitioning', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'pausing' }) })
      );
      await renderControls(root);
      await flushAsync();
    });

    it('renders a spinner', () => {
      const spinner = container.querySelector('[role="status"]');
      expect(spinner).not.toBeNull();
    });
  });

  describe('when fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 })
      );
      await renderControls(root);
      await flushAsync();
    });

    it('renders the Engine label', () => {
      expect(container.textContent).toContain('Engine');
    });
  });
});
