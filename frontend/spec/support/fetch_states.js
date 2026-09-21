import { flushAsync } from './async.js';
import { mockFetchFailure, mockFetchPending } from './fetch.js';

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
