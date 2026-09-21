import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import { act } from 'react';
import EngineControls from '../../src/components/elements/EngineControls.jsx';
import { mockFetchFailure, stubFetchSuccess } from '../support/fetch.js';

const renderControls = async (root) => {
  await act(async () => {
    root.render(createElement(EngineControls));
  });
};

const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text) ?? null;

const actionButtons = ['Pause', 'Stop', 'Restart', 'Reload', 'Continue', 'Start'];

// Expected buttons for each engine state, keyed by a readable state name.
// `extras` optionally registers additional specs inside the state's describe.
const scenarios = {
  running: {
    status: 'running',
    rendered: ['Pause', 'Stop', 'Restart', 'Reload', 'Shut Down'],
    absent: ['Continue', 'Start'],
    extras: (state) => {
      it('renders the Engine label', () => {
        expect(state.container.textContent).toContain('Engine');
      });
    }
  },
  paused: {
    status: 'paused',
    rendered: ['Stop', 'Restart', 'Reload', 'Continue', 'Shut Down'],
    absent: ['Pause', 'Start']
  },
  stopped: {
    status: 'stopped',
    rendered: ['Start', 'Shut Down'],
    absent: ['Pause', 'Stop', 'Restart', 'Reload', 'Continue']
  },
  transitioning: {
    status: 'pausing',
    rendered: ['Shut Down'],
    absent: [],
    extras: (state) => {
      it('renders a spinner', () => {
        expect(state.container.querySelector('[role="status"]')).not.toBeNull();
      });

      it('does not render action buttons', () => {
        actionButtons.forEach((text) => {
          expect(findButtonByText(state.container, text)).toBeNull();
        });
      });
    }
  }
};

describe('EngineControls', () => {
  const state = useContainer();

  Object.entries(scenarios).forEach(([name, { status, rendered, absent, extras }]) => {
    describe(`when engine is ${name}`, () => {
      beforeEach(async () => {
        stubFetchSuccess({ status });
        await renderControls(state.root);
        await flushAsync();
      });

      rendered.forEach((text) => {
        it(`renders the ${text} button`, () => {
          expect(findButtonByText(state.container, text)).not.toBeNull();
        });
      });

      absent.forEach((text) => {
        it(`does not render the ${text} button`, () => {
          expect(findButtonByText(state.container, text)).toBeNull();
        });
      });

      if (extras) extras(state);
    });
  });

  describe('when fetch fails', () => {
    mockFetchFailure(500);

    beforeEach(async () => {
      await renderControls(state.root);
      await flushAsync();
    });

    it('renders the Engine label', () => {
      expect(state.container.textContent).toContain('Engine');
    });
  });
});
