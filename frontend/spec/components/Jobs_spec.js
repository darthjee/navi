import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Jobs from '../../src/components/Jobs.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const render = async (container, root, { initialPath = '/jobs' } = {}) => {
  await act(async () => {
    root.render(
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

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}));
      await render(container, root);
    });

    it('renders a spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(container.textContent).toContain('Loading jobs');
    });
  });

  describe('when jobs load successfully', () => {
    const enqueuedJobs = [{ id: 'abc', status: 'enqueued', attempts: 0 }];
    const processingJobs = [{ id: 'def', status: 'processing', attempts: 1 }];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.callFake((url) => {
        const data = url.includes('enqueued') ? enqueuedJobs
          : url.includes('processing') ? processingJobs
            : [];
        return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
      });
      await render(container, root);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders a table', () => {
      expect(container.querySelector('table')).not.toBeNull();
    });

    it('renders a row for each job', () => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('shows the job id', () => {
      expect(container.textContent).toContain('abc');
    });

    it('shows the job status as a badge', () => {
      const badges = container.querySelectorAll('.badge');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0].textContent).toContain('enqueued');
    });

    it('shows the job attempts', () => {
      expect(container.textContent).toContain('0');
    });
  });

  describe('when no jobs exist', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      );
      await render(container, root);
      await flushAsync();
    });

    it('does not render a table', () => {
      expect(container.querySelector('table')).toBeNull();
    });

    it('shows an empty state message', () => {
      expect(container.textContent).toContain('No jobs found');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 503 })
      );
      await render(container, root);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders an error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows a descriptive error message', () => {
      expect(container.textContent).toContain('Failed to load jobs');
    });

    it('includes the error details in the message', () => {
      expect(container.textContent).toContain('HTTP 503');
    });
  });

  describe('when rendered with a status route param', () => {
    const failedJobs = [{ id: 'xyz', status: 'failed', attempts: 3 }];

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.callFake((url) => {
        const data = url.includes('failed') ? failedJobs : [];
        return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
      });
      await render(container, root, { initialPath: '/jobs/failed' });
      await flushAsync();
    });

    it('fetches only the specified status', () => {
      const calls = globalThis.fetch.calls.allArgs().map(([url]) => url);
      expect(calls.length).toBe(1);
      expect(calls[0]).toContain('failed');
    });

    it('renders jobs for that status', () => {
      expect(container.textContent).toContain('xyz');
    });
  });
});

