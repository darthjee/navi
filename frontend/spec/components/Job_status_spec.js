import { flushAsync } from 'navi-spec-support/async.js';
import { useContainer } from 'navi-spec-support/dom.js';
import { renderJob } from '../support/render_job.js';

const findRetryButton = ({ container }) => (
  Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Retry')
);

const textSections = {
  remainingAttempts: {
    label: 'Remaining attempts',
    shown: 'shows remaining attempts',
    hidden: 'does not show Remaining attempts',
    value: (job) => job.remainingAttempts,
  },
  readyIn: {
    label: 'Ready in',
    shown: 'shows Ready in',
    hidden: 'does not show Ready in',
  },
  lastError: {
    label: 'Last error',
    shown: 'shows Last error section',
    hidden: 'does not show Last error',
  },
};

// Generates one spec per entry declared in `visible`; entries left undefined are not asserted.
const itBehavesLikeVisibleSections = (state, job, visible) => {
  Object.entries(textSections).forEach(([key, { label, shown, hidden, value }]) => {
    if (visible[key] === undefined) return;

    if (visible[key]) {
      it(shown, () => {
        expect(state.container.textContent).toContain(label);
        if (value) expect(state.container.textContent).toContain(String(value(job)));
      });
    } else {
      it(hidden, () => {
        expect(state.container.textContent).not.toContain(label);
      });
    }
  });

  if (visible.retryButton === true) {
    it('shows a Retry button', () => {
      expect(findRetryButton(state)).toBeDefined();
    });
  } else if (visible.retryButton === false) {
    it('does not show a Retry button', () => {
      expect(findRetryButton(state)).toBeUndefined();
    });
  }
};

const itShowsCollapsedError = (state, message) => {
  it('shows the error message inside collapsible section', () => {
    expect(state.container.textContent).toContain(message);
  });

  it('shows the error section collapsed by default', () => {
    const details = state.container.querySelectorAll('details');
    const errorDetails = Array.from(details).find(d => d.textContent.includes('Show error'));
    expect(errorDetails).not.toBeNull();
    expect(errorDetails.open).toBeFalsy();
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
    visible: { remainingAttempts: true, readyIn: false, lastError: false, retryButton: false },
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
    visible: { remainingAttempts: true, lastError: false, retryButton: true },
    extraAssertions: (state) => {
      it('shows a countdown in seconds', () => {
        expect(state.container.textContent).toContain('5s');
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
    visible: { lastError: true },
    extraAssertions: (state) => {
      itShowsCollapsedError(state, 'connection refused');

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
    visible: { remainingAttempts: false, readyIn: false, lastError: false, retryButton: false },
    extraAssertions: (state) => {
      it('shows the job id', () => {
        expect(state.container.textContent).toContain('fin-1');
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
    visible: { remainingAttempts: false, readyIn: false, lastError: false, retryButton: true },
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
    visible: { remainingAttempts: false, readyIn: false, lastError: true },
    extraAssertions: (state) => {
      itShowsCollapsedError(state, 'fatal timeout');
    },
  },
];

describe('Job status rendering', () => {
  const state = useContainer();

  statusScenarios.forEach(({ label, job, visible, extraAssertions }) => {
    describe(`when the job is ${label}`, () => {
      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
        );
        await renderJob(state.root, job.id);
        await flushAsync();
      });

      itBehavesLikeVisibleSections(state, job, visible);
      if (extraAssertions) extraAssertions(state);
    });
  });
});
