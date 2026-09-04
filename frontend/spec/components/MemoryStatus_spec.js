import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MemoryStatus from '../../src/components/pages/MemoryStatus.jsx';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderMemoryStatus = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(MemoryStatus)));
  });
};

// `MemoryStatus` now also mounts `MemoryUsageChart`, which fetches
// `/memory/history.json` on its own. Stub fetch URL-aware so the status
// card gets `statusData` and the chart's history poll gets an empty batch
// (ending its poll loop without throwing on a non-array payload).
const mockFetchSuccessWithHistory = (statusData) => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.callFake((url) => {
      const data = url.toString().includes('/memory/history.json') ? [] : statusData;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
    });
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
      mockFetchSuccessWithHistory({ current: 26214400, maximum: 104857600, percentage: 25, status: 'low' });

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

      it('renders the memory usage chart', () => {
        expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
      });
    });

    describe('with status medium', () => {
      mockFetchSuccessWithHistory({ current: 41943040, maximum: 104857600, percentage: 40, status: 'medium' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the green color class', () => {
        expect(state.container.querySelector('.text-memory-medium')).not.toBeNull();
      });

      it('renders the memory usage chart', () => {
        expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
      });
    });

    describe('with status high', () => {
      mockFetchSuccessWithHistory({ current: 62914560, maximum: 104857600, percentage: 60, status: 'high' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the yellow color class', () => {
        expect(state.container.querySelector('.text-memory-high')).not.toBeNull();
      });

      it('renders the memory usage chart', () => {
        expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
      });
    });

    describe('with status over and percentage at exactly 100', () => {
      mockFetchSuccessWithHistory({ current: 104857600, maximum: 104857600, percentage: 100, status: 'over' });

      beforeEach(async () => {
        await renderMemoryStatus(state.root);
        await flushAsync();
      });

      it('applies the red color class', () => {
        expect(state.container.querySelector('.text-memory-over')).not.toBeNull();
      });

      it('renders the memory usage chart', () => {
        expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
      });
    });

    describe('with status over and percentage exceeding 100', () => {
      mockFetchSuccessWithHistory({ current: 115343360, maximum: 104857600, percentage: 110, status: 'over' });

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

      it('renders the memory usage chart', () => {
        expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
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
