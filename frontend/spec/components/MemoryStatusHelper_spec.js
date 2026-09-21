import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import MemoryStatusHelper from '../../src/components/pages/helpers/MemoryStatusHelper.jsx';
import { itBehavesLikeHelperFetchStates } from '../support/helper_states.js';

describe('MemoryStatusHelper', () => {
  const state = useContainer();

  itBehavesLikeHelperFetchStates({
    state,
    helper: MemoryStatusHelper,
    loadingText: 'Loading memory status',
    errorPrefix: 'Failed to load memory status',
  });

  describe('.render', () => {
    // Renders the helper output for `data`; call at describe level.
    const renderWith = (data) => {
      beforeEach(async () => {
        await renderInAct(state.root, MemoryStatusHelper.render(data));
      });
    };

    describe('when status is within bounds', () => {
      renderWith({ current: 89128960, maximum: 104857600, percentage: 85, status: 'high' });

      it('shows the status label', () => {
        expect(state.container.textContent).toContain('high');
      });

      it('shows the formatted current and maximum values', () => {
        expect(state.container.textContent).toContain('85.0 MB');
        expect(state.container.textContent).toContain('100.0 MB');
      });

      it('shows the formatted percentage', () => {
        expect(state.container.textContent).toContain('85.0%');
      });

      it('applies the color class matching the status', () => {
        expect(state.container.querySelector('.text-memory-high')).not.toBeNull();
      });
    });

    describe('when the percentage has floating point precision', () => {
      renderWith({ current: 89128960, maximum: 104857600, percentage: 16.326141357421875, status: 'high' });

      it('shows the percentage rounded to one decimal place', () => {
        expect(state.container.textContent).toContain('16.3%');
      });
    });

    describe('when percentage exceeds 100', () => {
      renderWith({ current: 115343360, maximum: 104857600, percentage: 110, status: 'over' });

      it('applies the over-limit purple override class', () => {
        expect(state.container.querySelector('.text-memory-over-limit')).not.toBeNull();
      });

      it('does not apply the plain over class', () => {
        expect(state.container.querySelector('.text-memory-over')).toBeNull();
      });
    });
  });
});
