import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MemoryStatusHelper from '../../src/components/pages/helpers/MemoryStatusHelper.jsx';

describe('MemoryStatusHelper', () => {
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

  describe('.renderLoading', () => {
    beforeEach(async () => {
      await act(async () => { root.render(MemoryStatusHelper.renderLoading()); });
    });

    it('renders the loading spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows a loading message', () => {
      expect(container.textContent).toContain('Loading memory status');
    });
  });

  describe('.renderError', () => {
    beforeEach(async () => {
      await act(async () => { root.render(MemoryStatusHelper.renderError('boom')); });
    });

    it('renders the error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows the error prefix and message', () => {
      expect(container.textContent).toContain('Failed to load memory status');
      expect(container.textContent).toContain('boom');
    });
  });

  describe('.render', () => {
    describe('when status is within bounds', () => {
      const data = { current: 89128960, maximum: 104857600, percentage: 85, status: 'high' };

      beforeEach(async () => {
        await act(async () => { root.render(MemoryStatusHelper.render(data)); });
      });

      it('shows the status label', () => {
        expect(container.textContent).toContain('high');
      });

      it('shows the formatted current and maximum values', () => {
        expect(container.textContent).toContain('85.0 MB');
        expect(container.textContent).toContain('100.0 MB');
      });

      it('shows the formatted percentage', () => {
        expect(container.textContent).toContain('85.0%');
      });

      it('applies the color class matching the status', () => {
        expect(container.querySelector('.text-memory-high')).not.toBeNull();
      });
    });

    describe('when the percentage has floating point precision', () => {
      const data = { current: 89128960, maximum: 104857600, percentage: 16.326141357421875, status: 'high' };

      beforeEach(async () => {
        await act(async () => { root.render(MemoryStatusHelper.render(data)); });
      });

      it('shows the percentage rounded to one decimal place', () => {
        expect(container.textContent).toContain('16.3%');
      });
    });

    describe('when percentage exceeds 100', () => {
      const data = { current: 115343360, maximum: 104857600, percentage: 110, status: 'over' };

      beforeEach(async () => {
        await act(async () => { root.render(MemoryStatusHelper.render(data)); });
      });

      it('applies the over-limit purple override class', () => {
        expect(container.querySelector('.text-memory-over-limit')).not.toBeNull();
      });

      it('does not apply the plain over class', () => {
        expect(container.querySelector('.text-memory-over')).toBeNull();
      });
    });
  });
});
