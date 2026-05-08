import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Job from '../../src/components/pages/Job.jsx';
import { useContainer } from '../support/dom.js';

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

const statusScenarios = [
  {
    label: 'enqueued',
    job: {
      id: 'enq-1',
      status: 'enqueued',
      attempts: 0,
      jobClass: 'ResourceRequestJob',
      arguments: { url: '/items.json', parameters: {} },
      remainingAttempts: 3,
    },
    assertions: (state) => {
      it('shows remaining attempts', () => {
        expect(state.container.textContent).toContain('3');
      });

      it('does not show Ready in', () => {
        expect(state.container.textContent).not.toContain('Ready in');
      });

      it('does not show Last error', () => {
        expect(state.container.textContent).not.toContain('Last error');
      });

      it('does not show a Retry button', () => {
        const buttons = Array.from(state.container.querySelectorAll('button'));
        expect(buttons.find(b => b.textContent === 'Retry')).toBeUndefined();
      });
    },
  },
  {
    label: 'failed without a recorded error',
    job: {
      id: 'abc-456',
      status: 'failed',
      attempts: 1,
      jobClass: 'AssetDownloadJob',
      arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
      remainingAttempts: 2,
      readyInMs: 5000,
    },
    assertions: (state) => {
      it('shows a countdown in seconds', () => {
        expect(state.container.textContent).toContain('5s');
      });

      it('shows remaining attempts', () => {
        expect(state.container.textContent).toContain('2');
      });

      it('does not show Last error', () => {
        expect(state.container.textContent).not.toContain('Last error');
      });

      it('shows a Retry button', () => {
        const buttons = Array.from(state.container.querySelectorAll('button'));
        expect(buttons.find(b => b.textContent === 'Retry')).toBeDefined();
      });
    },
  },
  {
    label: 'failed with a recorded error',
    job: {
      id: 'fail-err',
      status: 'failed',
      attempts: 2,
      jobClass: 'AssetDownloadJob',
      arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
      remainingAttempts: 1,
      readyInMs: 0,
      lastError: 'connection refused',
      backtrace: 'Error: connection refused\n    at Object.<anonymous>',
    },
    assertions: (state) => {
      it('shows Last error section', () => {
        expect(state.container.textContent).toContain('Last error');
      });

      it('shows the error message inside collapsible section', () => {
        expect(state.container.textContent).toContain('connection refused');
      });

      it('shows the error section collapsed by default', () => {
        const details = state.container.querySelectorAll('details');
        const errorDetails = Array.from(details).find(d => d.textContent.includes('Show error'));
        expect(errorDetails).not.toBeNull();
        expect(errorDetails.open).toBeFalsy();
      });

      it('shows Ready when readyInMs is 0', () => {
        expect(state.container.textContent).toContain('Ready');
      });
    },
  },
  {
    label: 'finished',
    job: {
      id: 'fin-1',
      status: 'finished',
      attempts: 3,
      jobClass: 'ResourceRequestJob',
      arguments: { url: '/done.json', parameters: {} },
    },
    assertions: (state) => {
      it('shows the job id', () => {
        expect(state.container.textContent).toContain('fin-1');
      });

      it('does not show Remaining attempts', () => {
        expect(state.container.textContent).not.toContain('Remaining attempts');
      });

      it('does not show Ready in', () => {
        expect(state.container.textContent).not.toContain('Ready in');
      });

      it('does not show Last error', () => {
        expect(state.container.textContent).not.toContain('Last error');
      });

      it('does not show a Retry button', () => {
        const buttons = Array.from(state.container.querySelectorAll('button'));
        expect(buttons.find(b => b.textContent === 'Retry')).toBeUndefined();
      });
    },
  },
  {
    label: 'dead without a recorded error',
    job: {
      id: 'dead-1',
      status: 'dead',
      attempts: 3,
      jobClass: 'ActionProcessingJob',
      arguments: { item: { id: 7 } },
    },
    assertions: (state) => {
      it('does not show Remaining attempts', () => {
        expect(state.container.textContent).not.toContain('Remaining attempts');
      });

      it('does not show Ready in', () => {
        expect(state.container.textContent).not.toContain('Ready in');
      });

      it('does not show Last error', () => {
        expect(state.container.textContent).not.toContain('Last error');
      });

      it('shows a Retry button', () => {
        const buttons = Array.from(state.container.querySelectorAll('button'));
        expect(buttons.find(b => b.textContent === 'Retry')).toBeDefined();
      });
    },
  },
  {
    label: 'dead with a recorded error',
    job: {
      id: 'dead-err',
      status: 'dead',
      attempts: 3,
      jobClass: 'ActionProcessingJob',
      arguments: { item: { id: 9 } },
      lastError: 'fatal timeout',
      backtrace: 'Error: fatal timeout\n    at Object.<anonymous>',
    },
    assertions: (state) => {
      it('shows Last error section', () => {
        expect(state.container.textContent).toContain('Last error');
      });

      it('shows the error message inside collapsible section', () => {
        expect(state.container.textContent).toContain('fatal timeout');
      });

      it('shows the error section collapsed by default', () => {
        const details = state.container.querySelectorAll('details');
        const errorDetails = Array.from(details).find(d => d.textContent.includes('Show error'));
        expect(errorDetails).not.toBeNull();
        expect(errorDetails.open).toBeFalsy();
      });

      it('does not show Remaining attempts', () => {
        expect(state.container.textContent).not.toContain('Remaining attempts');
      });

      it('does not show Ready in', () => {
        expect(state.container.textContent).not.toContain('Ready in');
      });
    },
  },
];

describe('Job status rendering', () => {
  const state = useContainer();

  statusScenarios.forEach(({ label, job, assertions }) => {
    describe(`when the job is ${label}`, () => {
      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
        );
        await renderJob(state.root, job.id);
        await flushAsync();
      });

      assertions(state);
    });
  });
});
