import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import StatsHeader from '../../src/components/elements/StatsHeader.jsx';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderStatsHeader = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(StatsHeader)));
  });
};

describe('StatsHeader', () => {
  const state = useContainer();

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await renderStatsHeader(state.root);
    });

    it('renders a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(state.container.textContent).toContain('Loading stats');
    });
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

    it('renders the Logs button', () => {
      expect(state.container.textContent).toContain('Logs');
    });

    it('links the Logs button to /logs', () => {
      const links = Array.from(state.container.querySelectorAll('a'));
      const hrefs = links.map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/logs');
    });
  });

  describe('when the fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(async () => {
      await renderStatsHeader(state.root);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders an error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows a descriptive error message', () => {
      expect(state.container.textContent).toContain('Failed to load stats');
    });

    it('includes the error details in the message', () => {
      expect(state.container.textContent).toContain('HTTP 503');
    });
  });
});
