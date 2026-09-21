import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Jobs from '../../src/components/pages/Jobs.jsx';
import { itBehavesLikeFetchStates } from '../support/fetch_states.js';

const render = async (state, { initialPath = '/jobs' } = {}) => {
  await act(async () => {
    state.root.render(
      createElement(
        MemoryRouter, { initialEntries: [initialPath] },
        createElement(Routes, null,
          createElement(Route, { path: '/jobs', element: createElement(Jobs) }),
          createElement(Route, { path: '/jobs/:status', element: createElement(Jobs) })
        )
      )
    );
  });
};

describe('Jobs', () => {
  const state = useContainer();

  itBehavesLikeFetchStates({
    state,
    render: () => render(state),
    loadingText: 'Loading jobs',
    errorText: 'Failed to load jobs',
    status: 503,
  });

  describe('when jobs load successfully', () => {
    const enqueuedJobs = [{ id: 'abc', status: 'enqueued', attempts: 0, jobClass: 'ResourceRequestJob' }];
    const processingJobs = [{ id: 'def', status: 'processing', attempts: 1, jobClass: 'AssetDownloadJob' }];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.callFake((url) => {
        const data = url.includes('enqueued') ? enqueuedJobs
          : url.includes('processing') ? processingJobs
            : [];
        return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
      });
      await render(state);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders a table', () => {
      expect(state.container.querySelector('table')).not.toBeNull();
    });

    it('renders a row for each job', () => {
      const rows = state.container.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('shows the job id', () => {
      expect(state.container.textContent).toContain('abc');
    });

    it('shows the job status as a badge', () => {
      const badges = state.container.querySelectorAll('.badge');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0].textContent).toContain('enqueued');
    });

    it('shows the job attempts', () => {
      expect(state.container.textContent).toContain('0');
    });

    it('shows the job class', () => {
      expect(state.container.textContent).toContain('ResourceRequestJob');
    });

    it('renders the filter checkboxes', () => {
      const checkboxes = state.container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('renders a status tab for each status', () => {
      const tabs = state.container.querySelectorAll('.nav-tabs .nav-item');
      expect(tabs.length).toBe(5);
    });
  });

  describe('when no jobs exist', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      );
      await render(state);
      await flushAsync();
    });

    it('does not render a table', () => {
      expect(state.container.querySelector('table')).toBeNull();
    });

    it('shows an empty state message', () => {
      expect(state.container.textContent).toContain('No jobs found');
    });
  });

  describe('when rendered with a status route param', () => {
    const failedJobs = [{ id: 'xyz', status: 'failed', attempts: 3, jobClass: 'HtmlParseJob' }];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.callFake((url) => {
        const data = url.includes('failed') ? failedJobs : [];
        return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
      });
      await render(state, { initialPath: '/jobs/failed' });
      await flushAsync();
    });

    it('fetches only the specified status', () => {
      const calls = globalThis.fetch.calls.allArgs().map(([url]) => url);
      expect(calls.length).toBe(1);
      expect(calls[0]).toContain('failed');
    });

    it('renders jobs for that status', () => {
      expect(state.container.textContent).toContain('xyz');
    });
  });
});

