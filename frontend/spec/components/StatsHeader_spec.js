import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import StatsHeader from '../../src/components/elements/StatsHeader.jsx';
import { flushAsync } from '../support/async.js';
import { useContainer } from '../support/dom.js';
import { mockFetchSuccess } from '../support/fetch.js';
import { itBehavesLikeFetchStates } from '../support/fetch_states.js';

const renderStatsHeader = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(StatsHeader)));
  });
};

describe('StatsHeader', () => {
  const state = useContainer();

  itBehavesLikeFetchStates({
    state,
    render: () => renderStatsHeader(state.root),
    loadingText: 'Loading stats',
    errorText: 'Failed to load stats',
    status: 503,
  });

  describe('when stats load successfully', () => {
    const stats = {
      workers: { idle: 3, busy: 1 },
      jobs: { enqueued: 5, processing: 2, failed: 1, finished: 10, dead: 0 },
    };

    mockFetchSuccess(stats);

    beforeEach(async () => {
      await renderStatsHeader(state.root);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders the Workers section', () => {
      expect(state.container.textContent).toContain('Workers');
    });

    it('renders the Jobs section', () => {
      expect(state.container.textContent).toContain('Jobs');
    });

    it('shows the idle worker count', () => {
      const cards = state.container.querySelectorAll('.card');
      const idleCard = Array.from(cards).find((c) => c.textContent.includes('Idle'));
      expect(idleCard).not.toBeNull();
      expect(idleCard.textContent).toContain('3');
    });

    it('shows the busy worker count', () => {
      const cards = state.container.querySelectorAll('.card');
      const busyCard = Array.from(cards).find((c) => c.textContent.includes('Busy'));
      expect(busyCard).not.toBeNull();
      expect(busyCard.textContent).toContain('1');
    });

    it('shows all job stat items', () => {
      const text = state.container.textContent;
      expect(text).toContain('Enqueued');
      expect(text).toContain('Processing');
      expect(text).toContain('Failed');
      expect(text).toContain('Finished');
      expect(text).toContain('Dead');
    });

    it('links each job stat item to its jobs list page', () => {
      const links = Array.from(state.container.querySelectorAll('a'));
      const hrefs = links.map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/jobs/enqueued');
      expect(hrefs).toContain('/jobs/processing');
      expect(hrefs).toContain('/jobs/failed');
      expect(hrefs).toContain('/jobs/finished');
      expect(hrefs).toContain('/jobs/dead');
    });

    it('does not render a Logs stat card', () => {
      expect(state.container.textContent).not.toContain('Logs');
    });

    it('does not render a Memory stat card', () => {
      expect(state.container.textContent).not.toContain('Memory');
    });

    it('does not link to /logs or /memory/status', () => {
      const links = Array.from(state.container.querySelectorAll('a'));
      const hrefs = links.map((a) => a.getAttribute('href'));
      expect(hrefs).not.toContain('/logs');
      expect(hrefs).not.toContain('/memory/status');
    });
  });
});
