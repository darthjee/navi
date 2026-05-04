import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Job from '../../src/components/pages/Job.jsx';
import noop from '../../src/utils/noop.js';

const mockJobFetch = (job) => {
  let callCount = 0;
  spyOn(globalThis, 'fetch').and.callFake(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) });
    }
    return new Promise(noop);
  });
};

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const renderJob = async (root, id = 'abc-123') => {
  await act(async () => {
    root.render(
      createElement(MemoryRouter, { initialEntries: [`/job/${id}`] },
        createElement(Routes, null,
          createElement(Route, { path: '/job/:id', element: createElement(Job) })
        )
      )
    );
  });
};

describe('Job', () => {
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
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await renderJob(root);
    });

    it('renders a spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(container.textContent).toContain('Loading job');
    });
  });

  describe('when the job loads successfully', () => {
    const job = {
      id: 'abc-123',
      status: 'processing',
      attempts: 2,
      jobClass: 'ResourceRequestJob',
      arguments: { url: '/items.json', parameters: {} },
      remainingAttempts: 1,
    };

    beforeEach(async () => {
      mockJobFetch(job);
      await renderJob(root, 'abc-123');
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('shows the job id', () => {
      expect(container.textContent).toContain('abc-123');
    });

    it('shows the job status', () => {
      expect(container.textContent).toContain('processing');
    });

    it('shows the job attempts', () => {
      expect(container.textContent).toContain('2');
    });

    it('shows the status as a badge', () => {
      expect(container.querySelector('.badge')).not.toBeNull();
    });

    it('renders a back link to jobs', () => {
      expect(container.textContent).toContain('Back to Jobs');
    });

    it('shows the job class', () => {
      expect(container.textContent).toContain('ResourceRequestJob');
    });

    it('shows the job arguments collapsed by default', () => {
      const details = container.querySelector('details');
      expect(details).not.toBeNull();
      expect(details.open).toBeFalsy();
    });

    it('contains job arguments inside collapsible section', () => {
      expect(container.textContent).toContain('/items.json');
    });

    it('shows the remaining attempts', () => {
      expect(container.textContent).toContain('1');
    });

    it('does not show Ready in for processing status', () => {
      expect(container.textContent).not.toContain('Ready in');
    });

    it('renders the logs section', () => {
      expect(container.querySelector('.bg-dark')).not.toBeNull();
    });
  });

  describe('when the job is not found', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 404 })
      );
      await renderJob(root, 'nonexistent');
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders a not-found alert', () => {
      expect(container.querySelector('.alert-warning')).not.toBeNull();
    });

    it('shows a not-found message', () => {
      expect(container.textContent).toContain('Job not found');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 })
      );
      await renderJob(root);
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders an error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows a descriptive error message', () => {
      expect(container.textContent).toContain('Failed to load job');
    });

    it('includes the error details in the message', () => {
      expect(container.textContent).toContain('HTTP 500');
    });
  });
});

