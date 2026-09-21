import { flushAsync } from 'navi-spec-support/async.js';
import { mockFetchFailure } from './fetch.js';
import noop from '../../src/utils/noop.js';

// Stubs globalThis.fetch with a promise that never resolves (loading state).
// Lives here (not in fetch.js) because fetch.js is shipped verbatim in the
// navi-hey-test image and must not import from frontend/src.
const mockFetchPending = () => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
  });
};

// Registers the shared "while loading" and "when the fetch fails" scenarios.
// Call at describe level. `render` is an async function without arguments that
// renders the component under test into the container held by `state`
// (from useContainer()).
const itBehavesLikeFetchStates = ({ state, render, loadingText, errorText, status }) => {
  describe('while loading', () => {
    mockFetchPending();

    beforeEach(render);

    it('renders a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(state.container.textContent).toContain(loadingText);
    });
  });

  describe('when the fetch fails', () => {
    mockFetchFailure(status);

    beforeEach(async () => {
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders an error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows a descriptive error message', () => {
      expect(state.container.textContent).toContain(errorText);
    });

    it('includes the error details in the message', () => {
      expect(state.container.textContent).toContain(`HTTP ${status}`);
    });
  });
};

export { itBehavesLikeFetchStates };
