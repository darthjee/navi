import MemoryStatusHelper from '../../src/components/pages/helpers/MemoryStatusHelper.jsx';
import { renderInAct, useContainer } from '../support/dom.js';

describe('MemoryStatusHelper', () => {
  const state = useContainer();

  describe('.renderLoading', () => {
    beforeEach(async () => {
      await renderInAct(state.root, MemoryStatusHelper.renderLoading());
    });

    it('renders the loading spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows a loading message', () => {
      expect(state.container.textContent).toContain('Loading memory status');
    });
  });

  describe('.renderError', () => {
    beforeEach(async () => {
      await renderInAct(state.root, MemoryStatusHelper.renderError('boom'));
    });

    it('renders the error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows the error prefix and message', () => {
      expect(state.container.textContent).toContain('Failed to load memory status');
      expect(state.container.textContent).toContain('boom');
    });
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
