import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MemoryStatus from '../../src/components/pages/MemoryStatus.jsx';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderMemoryStatus = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(MemoryStatus)));
  });
};

describe('MemoryStatus', () => {
  const state = useContainer();

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await renderMemoryStatus(state.root);
    });

    it('renders a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(state.container.textContent).toContain('Loading memory status');
    });
  });

  describe('when the status loads successfully', () => {
    describe('with status low', () => {
      mockFetchSuccess({ current: 26214400, maximum: 104857600, percentage: 25, status: 'low' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('does not show a spinner', () => {
        expect(state.container.querySelector('.spinner-border')).toBeNull();
      });

      it('shows the status label', () => {
        expect(state.container.textContent).toContain('low');
      });

      it('applies the dark gray color class', () => {
        expect(state.container.querySelector('.text-memory-low')).not.toBeNull();
      });

      it('shows the formatted byte values', () => {
        expect(state.container.textContent).toContain('25.0 MB');
        expect(state.container.textContent).toContain('100.0 MB');
      });
    });

    describe('with status medium', () => {
      mockFetchSuccess({ current: 41943040, maximum: 104857600, percentage: 40, status: 'medium' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the green color class', () => {
        expect(state.container.querySelector('.text-memory-medium')).not.toBeNull();
      });
    });

    describe('with status high', () => {
      mockFetchSuccess({ current: 62914560, maximum: 104857600, percentage: 60, status: 'high' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the yellow color class', () => {
        expect(state.container.querySelector('.text-memory-high')).not.toBeNull();
      });
    });

    describe('with status over and percentage at exactly 100', () => {
      mockFetchSuccess({ current: 104857600, maximum: 104857600, percentage: 100, status: 'over' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the red color class', () => {
        expect(state.container.querySelector('.text-memory-over')).not.toBeNull();
      });
    });

    describe('with status over and percentage exceeding 100', () => {
      mockFetchSuccess({ current: 115343360, maximum: 104857600, percentage: 110, status: 'over' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the purple over-limit color class', () => {
        expect(state.container.querySelector('.text-memory-over-limit')).not.toBeNull();
      });

      it('does not apply the plain over color class', () => {
        expect(state.container.querySelector('.text-memory-over')).toBeNull();
      });
    });
  });

  describe('when the fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(async () => {
      await renderMemoryStatus(state.root);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders an error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows a descriptive error message', () => {
      expect(state.container.textContent).toContain('Failed to load memory status');
    });

    it('includes the error details in the message', () => {
      expect(state.container.textContent).toContain('HTTP 503');
    });
  });
});
