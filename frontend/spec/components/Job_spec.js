import noop from '../../src/utils/noop.js';
import { flushAsync } from '../support/async.js';
import { useContainer } from '../support/dom.js';
import { itBehavesLikeFetchStates } from '../support/fetch_states.js';
import { renderJob } from '../support/render_job.js';

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

describe('Job', () => {
  const state = useContainer();

  itBehavesLikeFetchStates({
    state,
    render: () => renderJob(state.root),
    loadingText: 'Loading job',
    errorText: 'Failed to load job',
    status: 500,
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
      await renderJob(state.root, 'abc-123');
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('shows the job id', () => {
      expect(state.container.textContent).toContain('abc-123');
    });

    it('shows the job status', () => {
      expect(state.container.textContent).toContain('processing');
    });

    it('shows the job attempts', () => {
      expect(state.container.textContent).toContain('2');
    });

    it('shows the status as a badge', () => {
      expect(state.container.querySelector('.badge')).not.toBeNull();
    });

    it('renders a back link to jobs', () => {
      expect(state.container.textContent).toContain('Back to Jobs');
    });

    it('shows the job class', () => {
      expect(state.container.textContent).toContain('ResourceRequestJob');
    });

    it('shows the job arguments collapsed by default', () => {
      const details = state.container.querySelector('details');
      expect(details).not.toBeNull();
      expect(details.open).toBeFalsy();
    });

    it('contains job arguments inside collapsible section', () => {
      expect(state.container.textContent).toContain('/items.json');
    });

    it('shows the remaining attempts', () => {
      expect(state.container.textContent).toContain('1');
    });

    it('does not show Ready in for processing status', () => {
      expect(state.container.textContent).not.toContain('Ready in');
    });

    it('renders the logs section', () => {
      expect(state.container.querySelector('.bg-dark')).not.toBeNull();
    });
  });

  describe('when the job is not found', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 404 })
      );
      await renderJob(state.root, 'nonexistent');
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders a not-found alert', () => {
      expect(state.container.querySelector('.alert-warning')).not.toBeNull();
    });

    it('shows a not-found message', () => {
      expect(state.container.textContent).toContain('Job not found');
    });
  });
});

