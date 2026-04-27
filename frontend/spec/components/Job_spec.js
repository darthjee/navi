import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Job from '../../src/components/Job.jsx';

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
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}));
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
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
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
  });

  describe('when the job is enqueued', () => {
    const job = {
      id: 'enq-1',
      status: 'enqueued',
      attempts: 0,
      jobClass: 'ResourceRequestJob',
      arguments: { url: '/items.json', parameters: {} },
      remainingAttempts: 3,
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
      await renderJob(root, 'enq-1');
      await flushAsync();
    });

    it('shows remaining attempts', () => {
      expect(container.textContent).toContain('3');
    });

    it('does not show Ready in', () => {
      expect(container.textContent).not.toContain('Ready in');
    });

    it('does not show Last error', () => {
      expect(container.textContent).not.toContain('Last error');
    });
  });

  describe('when the job has failed without a recorded error', () => {
    const job = {
      id: 'abc-456',
      status: 'failed',
      attempts: 1,
      jobClass: 'AssetDownloadJob',
      arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
      remainingAttempts: 2,
      readyInMs: 5000,
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
      await renderJob(root, 'abc-456');
      await flushAsync();
    });

    it('shows a countdown in seconds', () => {
      expect(container.textContent).toContain('5s');
    });

    it('shows remaining attempts', () => {
      expect(container.textContent).toContain('2');
    });

    it('does not show Last error', () => {
      expect(container.textContent).not.toContain('Last error');
    });
  });

  describe('when the job has failed with a recorded error', () => {
    const job = {
      id: 'fail-err',
      status: 'failed',
      attempts: 2,
      jobClass: 'AssetDownloadJob',
      arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
      remainingAttempts: 1,
      readyInMs: 0,
      lastError: 'connection refused',
      backtrace: 'Error: connection refused\n    at Object.<anonymous>',
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
      await renderJob(root, 'fail-err');
      await flushAsync();
    });

    it('shows Last error section', () => {
      expect(container.textContent).toContain('Last error');
    });

    it('shows the error message inside collapsible section', () => {
      expect(container.textContent).toContain('connection refused');
    });

    it('shows the error section collapsed by default', () => {
      const details = container.querySelectorAll('details');
      const errorDetails = Array.from(details).find(d => d.textContent.includes('Show error'));
      expect(errorDetails).not.toBeNull();
      expect(errorDetails.open).toBeFalsy();
    });

    it('shows Ready when readyInMs is 0', () => {
      expect(container.textContent).toContain('Ready');
    });
  });

  describe('when the job is finished', () => {
    const job = {
      id: 'fin-1',
      status: 'finished',
      attempts: 3,
      jobClass: 'ResourceRequestJob',
      arguments: { url: '/done.json', parameters: {} },
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
      await renderJob(root, 'fin-1');
      await flushAsync();
    });

    it('shows the job id', () => {
      expect(container.textContent).toContain('fin-1');
    });

    it('does not show Remaining attempts', () => {
      expect(container.textContent).not.toContain('Remaining attempts');
    });

    it('does not show Ready in', () => {
      expect(container.textContent).not.toContain('Ready in');
    });

    it('does not show Last error', () => {
      expect(container.textContent).not.toContain('Last error');
    });
  });

  describe('when the job is dead without a recorded error', () => {
    const job = {
      id: 'dead-1',
      status: 'dead',
      attempts: 3,
      jobClass: 'ActionProcessingJob',
      arguments: { item: { id: 7 } },
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
      await renderJob(root, 'dead-1');
      await flushAsync();
    });

    it('does not show Remaining attempts', () => {
      expect(container.textContent).not.toContain('Remaining attempts');
    });

    it('does not show Ready in', () => {
      expect(container.textContent).not.toContain('Ready in');
    });

    it('does not show Last error', () => {
      expect(container.textContent).not.toContain('Last error');
    });
  });

  describe('when the job is dead with a recorded error', () => {
    const job = {
      id: 'dead-err',
      status: 'dead',
      attempts: 3,
      jobClass: 'ActionProcessingJob',
      arguments: { item: { id: 9 } },
      lastError: 'fatal timeout',
      backtrace: 'Error: fatal timeout\n    at Object.<anonymous>',
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
      );
      await renderJob(root, 'dead-err');
      await flushAsync();
    });

    it('shows Last error section', () => {
      expect(container.textContent).toContain('Last error');
    });

    it('shows the error message inside collapsible section', () => {
      expect(container.textContent).toContain('fatal timeout');
    });

    it('shows the error section collapsed by default', () => {
      const details = container.querySelectorAll('details');
      const errorDetails = Array.from(details).find(d => d.textContent.includes('Show error'));
      expect(errorDetails).not.toBeNull();
      expect(errorDetails.open).toBeFalsy();
    });

    it('does not show Remaining attempts', () => {
      expect(container.textContent).not.toContain('Remaining attempts');
    });

    it('does not show Ready in', () => {
      expect(container.textContent).not.toContain('Ready in');
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

