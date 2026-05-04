import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import EngineControls from '../../src/components/elements/EngineControls.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderControls = async (root) => {
  await act(async () => {
    root.render(createElement(EngineControls));
  });
};

const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text) ?? null;

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

    it('renders the Pause button', () => {
      expect(findButtonByText(container, 'Pause')).not.toBeNull();
    });

    it('renders the Stop button', () => {
      expect(findButtonByText(container, 'Stop')).not.toBeNull();
    });

    it('renders the Restart button', () => {
      expect(findButtonByText(container, 'Restart')).not.toBeNull();
    });

    it('does not render the Continue button', () => {
      expect(findButtonByText(container, 'Continue')).toBeNull();
    });

    it('does not render the Start button', () => {
      expect(findButtonByText(container, 'Start')).toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(container, 'Shut Down')).not.toBeNull();
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

    it('does not render the Pause button', () => {
      expect(findButtonByText(container, 'Pause')).toBeNull();
    });

    it('renders the Stop button', () => {
      expect(findButtonByText(container, 'Stop')).not.toBeNull();
    });

    it('renders the Restart button', () => {
      expect(findButtonByText(container, 'Restart')).not.toBeNull();
    });

    it('renders the Continue button', () => {
      expect(findButtonByText(container, 'Continue')).not.toBeNull();
    });

    it('does not render the Start button', () => {
      expect(findButtonByText(container, 'Start')).toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(container, 'Shut Down')).not.toBeNull();
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

    it('does not render the Pause button', () => {
      expect(findButtonByText(container, 'Pause')).toBeNull();
    });

    it('does not render the Stop button', () => {
      expect(findButtonByText(container, 'Stop')).toBeNull();
    });

    it('does not render the Restart button', () => {
      expect(findButtonByText(container, 'Restart')).toBeNull();
    });

    it('does not render the Continue button', () => {
      expect(findButtonByText(container, 'Continue')).toBeNull();
    });

    it('renders the Start button', () => {
      expect(findButtonByText(container, 'Start')).not.toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(container, 'Shut Down')).not.toBeNull();
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

    it('does not render action buttons', () => {
      expect(findButtonByText(container, 'Pause')).toBeNull();
      expect(findButtonByText(container, 'Stop')).toBeNull();
      expect(findButtonByText(container, 'Restart')).toBeNull();
      expect(findButtonByText(container, 'Continue')).toBeNull();
      expect(findButtonByText(container, 'Start')).toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(container, 'Shut Down')).not.toBeNull();
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
