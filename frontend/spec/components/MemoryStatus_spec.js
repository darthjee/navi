import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import MemoryStatus from '../../src/components/pages/MemoryStatus.jsx';
import { flushAsync } from '../support/async.js';
import { renderInAct, useContainer } from '../support/dom.js';
import { mockFetchSuccessWithHistory } from '../support/fetch_memory_status.js';
import { itBehavesLikeFetchStates } from '../support/fetch_states.js';

const renderMemoryStatus = (root) => (
  renderInAct(root, createElement(MemoryRouter, null, createElement(MemoryStatus)))
);

describe('MemoryStatus', () => {
  const state = useContainer();

  const itRendersTheChart = () => {
    it('renders the memory usage chart', () => {
      expect(state.container.querySelector('[data-testid="memory-usage-chart"]')).not.toBeNull();
    });
  };

  const statusScenarios = [
    {
      description: 'with status low',
      data: { current: 26214400, maximum: 104857600, percentage: 25, status: 'low' },
      label: 'dark gray',
      colorClass: 'text-memory-low',
      extras: () => {
        it('does not show a spinner', () => {
          expect(state.container.querySelector('.spinner-border')).toBeNull();
        });

        it('shows the status label', () => {
          expect(state.container.textContent).toContain('low');
        });

        it('shows the formatted byte values', () => {
          expect(state.container.textContent).toContain('25.0 MB');
          expect(state.container.textContent).toContain('100.0 MB');
        });
      },
    },
    {
      description: 'with status medium',
      data: { current: 41943040, maximum: 104857600, percentage: 40, status: 'medium' },
      label: 'green',
      colorClass: 'text-memory-medium',
    },
    {
      description: 'with status high',
      data: { current: 62914560, maximum: 104857600, percentage: 60, status: 'high' },
      label: 'yellow',
      colorClass: 'text-memory-high',
    },
    {
      description: 'with status over and percentage at exactly 100',
      data: { current: 104857600, maximum: 104857600, percentage: 100, status: 'over' },
      label: 'red',
      colorClass: 'text-memory-over',
    },
    {
      description: 'with status over and percentage exceeding 100',
      data: { current: 115343360, maximum: 104857600, percentage: 110, status: 'over' },
      label: 'purple over-limit',
      colorClass: 'text-memory-over-limit',
      extras: () => {
        it('does not apply the plain over color class', () => {
          expect(state.container.querySelector('.text-memory-over')).toBeNull();
        });
      },
    },
  ];

  itBehavesLikeFetchStates({
    state,
    render: () => renderMemoryStatus(state.root),
    loadingText: 'Loading memory status',
    errorText: 'Failed to load memory status',
    status: 503,
  });

  describe('when the status loads successfully', () => {
    statusScenarios.forEach(({ description, data, label, colorClass, extras }) => {
      describe(description, () => {
        mockFetchSuccessWithHistory(data);

        beforeEach(async () => {
          await renderMemoryStatus(state.root);
          await flushAsync();
        });

        it(`applies the ${label} color class`, () => {
          expect(state.container.querySelector(`.${colorClass}`)).not.toBeNull();
        });

        itRendersTheChart();

        if (extras) extras();
      });
    });
  });
});
