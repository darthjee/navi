import { createElement } from 'react';
import { act } from 'react';
import MemoryUsageChart from '../../src/components/elements/MemoryUsageChart.jsx';
import { useContainer } from '../support/dom.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderChart = async (root, props) => {
  await act(async () => {
    root.render(createElement(MemoryUsageChart, props));
  });
};

// Stubs globalThis.fetch to resolve with `entries` on the first call and an
// empty batch on every subsequent call, so `MemoryChartController`'s
// immediate re-poll on a non-empty batch settles instead of looping forever.
const mockHistoryResponse = (entries) => {
  beforeEach(() => {
    let call = 0;
    spyOn(globalThis, 'fetch').and.callFake(() => {
      const payload = call === 0 ? entries : [];
      call += 1;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
    });
  });
};

// This is at most a smoke test: jsdom (the spec environment) has no
// `canvas`/layout support, so it can't lay out recharts' SVG output. Visual
// correctness (line shape, reference lines, overflow indicator) must be
// verified by hand in a browser — see the frontend plan's notes.
describe('MemoryUsageChart', () => {
  const state = useContainer();

  describe('with no history points', () => {
    mockHistoryResponse([]);

    it('renders without throwing', async () => {
      await renderChart(state.root, { maximum: 104857600, status: 'low' });
      await flushAsync();

      expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
    });
  });

  describe('with a single history point', () => {
    mockHistoryResponse([
      { id: 1, value: 26214400, percentage: 25, timestamp: '2026-09-01T00:00:00Z' },
    ]);

    it('renders without throwing', async () => {
      await renderChart(state.root, { maximum: 104857600, status: 'low' });
      await flushAsync();

      expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
    });
  });

  describe('with several history points including one over 100%', () => {
    mockHistoryResponse([
      { id: 1, value: 26214400, percentage: 25, timestamp: '2026-09-01T00:00:00Z' },
      { id: 2, value: 62914560, percentage: 60, timestamp: '2026-09-01T00:00:05Z' },
      { id: 3, value: 78643200, percentage: 75, timestamp: '2026-09-01T00:00:10Z' },
      { id: 4, value: 115343360, percentage: 110, timestamp: '2026-09-01T00:00:15Z' },
    ]);

    it('renders without throwing', async () => {
      await renderChart(state.root, { maximum: 104857600, status: 'over' });
      await flushAsync();

      expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
    });
  });
});
