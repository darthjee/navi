import { renderInAct } from 'navi-spec-support/dom.js';

const identity = (element) => element;

// Registers the shared `.renderLoading` and `.renderError` scenarios of a
// helper. Call at describe level.
// - `state`: the object returned by useContainer().
// - `helper`: the helper under test (must expose renderLoading and renderError).
// - `wrap`: optional (element) => element applied before rendering, e.g. to
//   provide a router. Defaults to identity.
// - `loadingText`: optional text expected while loading.
// - `errorPrefix`: optional text expected in the error alert besides the message.
// - `errorMessage`: message passed to renderError. Defaults to 'boom'.
const itBehavesLikeHelperFetchStates = ({
  state,
  helper,
  wrap = identity,
  loadingText,
  errorPrefix,
  errorMessage = 'boom',
}) => {
  describe('.renderLoading', () => {
    beforeEach(async () => {
      await renderInAct(state.root, wrap(helper.renderLoading()));
    });

    it('renders a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    if (loadingText) {
      it('shows the loading text', () => {
        expect(state.container.textContent).toContain(loadingText);
      });
    }
  });

  describe('.renderError', () => {
    beforeEach(async () => {
      await renderInAct(state.root, wrap(helper.renderError(errorMessage)));
    });

    it('renders an alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows the error message', () => {
      expect(state.container.textContent).toContain(errorMessage);
    });

    if (errorPrefix) {
      it('shows the error prefix', () => {
        expect(state.container.textContent).toContain(errorPrefix);
      });
    }
  });
};

// Registers the shared empty-state scenarios of a feed helper. Call at
// describe level.
// - `state`: the object returned by useContainer().
// - `render`: async function without arguments that renders the empty variant
//   of the helper into the container held by `state`.
// - `emptyText`: text expected when there is nothing to show.
const itBehavesLikeEmptyFeed = ({ state, render, emptyText }) => {
  describe('when there are no items', () => {
    beforeEach(render);

    it('shows the empty state message', () => {
      expect(state.container.textContent).toContain(emptyText);
    });

    it('does not render a table', () => {
      expect(state.container.querySelector('table')).toBeNull();
    });
  });
};

export { itBehavesLikeEmptyFeed, itBehavesLikeHelperFetchStates };
