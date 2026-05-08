import { createElement } from 'react';
import { act } from 'react';
import EngineControls from '../../src/components/elements/EngineControls.jsx';
import { useContainer } from '../support/dom.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderControls = async (root) => {
  await act(async () => {
    root.render(createElement(EngineControls));
  });
};

const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text) ?? null;

describe('EngineControls', () => {
  const state = useContainer();

  describe('when engine is running', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'running' }) })
      );
      await renderControls(state.root);
      await flushAsync();
    });

    it('renders the Engine label', () => {
      expect(state.container.textContent).toContain('Engine');
    });

    it('renders the Pause button', () => {
      expect(findButtonByText(state.container, 'Pause')).not.toBeNull();
    });

    it('renders the Stop button', () => {
      expect(findButtonByText(state.container, 'Stop')).not.toBeNull();
    });

    it('renders the Restart button', () => {
      expect(findButtonByText(state.container, 'Restart')).not.toBeNull();
    });

    it('does not render the Continue button', () => {
      expect(findButtonByText(state.container, 'Continue')).toBeNull();
    });

    it('does not render the Start button', () => {
      expect(findButtonByText(state.container, 'Start')).toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(state.container, 'Shut Down')).not.toBeNull();
    });
  });

  describe('when engine is paused', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'paused' }) })
      );
      await renderControls(state.root);
      await flushAsync();
    });

    it('does not render the Pause button', () => {
      expect(findButtonByText(state.container, 'Pause')).toBeNull();
    });

    it('renders the Stop button', () => {
      expect(findButtonByText(state.container, 'Stop')).not.toBeNull();
    });

    it('renders the Restart button', () => {
      expect(findButtonByText(state.container, 'Restart')).not.toBeNull();
    });

    it('renders the Continue button', () => {
      expect(findButtonByText(state.container, 'Continue')).not.toBeNull();
    });

    it('does not render the Start button', () => {
      expect(findButtonByText(state.container, 'Start')).toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(state.container, 'Shut Down')).not.toBeNull();
    });
  });

  describe('when engine is stopped', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'stopped' }) })
      );
      await renderControls(state.root);
      await flushAsync();
    });

    it('does not render the Pause button', () => {
      expect(findButtonByText(state.container, 'Pause')).toBeNull();
    });

    it('does not render the Stop button', () => {
      expect(findButtonByText(state.container, 'Stop')).toBeNull();
    });

    it('does not render the Restart button', () => {
      expect(findButtonByText(state.container, 'Restart')).toBeNull();
    });

    it('does not render the Continue button', () => {
      expect(findButtonByText(state.container, 'Continue')).toBeNull();
    });

    it('renders the Start button', () => {
      expect(findButtonByText(state.container, 'Start')).not.toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(state.container, 'Shut Down')).not.toBeNull();
    });
  });

  describe('when engine is transitioning', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'pausing' }) })
      );
      await renderControls(state.root);
      await flushAsync();
    });

    it('renders a spinner', () => {
      const spinner = state.container.querySelector('[role="status"]');
      expect(spinner).not.toBeNull();
    });

    it('does not render action buttons', () => {
      expect(findButtonByText(state.container, 'Pause')).toBeNull();
      expect(findButtonByText(state.container, 'Stop')).toBeNull();
      expect(findButtonByText(state.container, 'Restart')).toBeNull();
      expect(findButtonByText(state.container, 'Continue')).toBeNull();
      expect(findButtonByText(state.container, 'Start')).toBeNull();
    });

    it('renders the Shut Down button', () => {
      expect(findButtonByText(state.container, 'Shut Down')).not.toBeNull();
    });
  });

  describe('when fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 })
      );
      await renderControls(state.root);
      await flushAsync();
    });

    it('renders the Engine label', () => {
      expect(state.container.textContent).toContain('Engine');
    });
  });
});
