import LogsController from '../../../src/components/elements/controllers/LogsController.jsx';
import noop from '../../../src/utils/noop.js';
import { flushAsync } from '../../support/async.js';
import { buildControllerState } from '../../support/controller_state.js';

const pendingFetchLogs = () => jasmine.createSpy('fetchLogs').and.returnValue(new Promise(noop));

// Builds the controller and runs its polling effect, returning the refs,
// the setLogs spy and the effect cleanup.
const startPolling = (fetchLogs) => {
  const { cancelledRef, lastIdRef } = buildControllerState();
  const setLogs = jasmine.createSpy('setLogs');
  const view = LogsController.build([], fetchLogs);
  const cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();
  return { cancelledRef, lastIdRef, setLogs, cleanup };
};

// Runs the scroll effect for the given logs and returns the scrollIntoView spy.
const runScrollEffect = (logs) => {
  const scrollSpy = jasmine.createSpy('scrollIntoView');
  const bottomRef = { current: { scrollIntoView: scrollSpy } };
  LogsController.build(logs, pendingFetchLogs()).buildScrollEffect(bottomRef)();
  return scrollSpy;
};

describe('LogsController', () => {
  describe('.build', () => {
    it('returns a LogsController instance', () => {
      const view = LogsController.build([], pendingFetchLogs());
      expect(view).toBeInstanceOf(LogsController);
    });
  });

  describe('#buildPollingEffect', () => {
    let polling;

    afterEach(() => { polling.cleanup(); });

    describe('when logs are returned on the first poll', () => {
      const entries = [
        { id: 10, level: 'info', message: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
      ];

      let fetchLogs;

      beforeEach(async () => {
        let callCount = 0;
        fetchLogs = jasmine.createSpy('fetchLogs').and.callFake(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve(entries);
          return new Promise(noop);
        });

        polling = startPolling(fetchLogs);
        await flushAsync();
      });

      it('calls fetchLogs with the current lastId', () => {
        expect(fetchLogs).toHaveBeenCalledWith({ lastId: null });
      });

      it('calls setLogs with the new entries', () => {
        expect(polling.setLogs).toHaveBeenCalled();
      });

      it('updates lastIdRef to the id of the last entry', () => {
        expect(polling.lastIdRef.current).toBe(10);
      });

      it('polls again immediately', () => {
        expect(fetchLogs.calls.count()).toBeGreaterThan(1);
      });
    });

    describe('when the response is empty', () => {
      let fetchLogs;

      beforeEach(async () => {
        fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(Promise.resolve([]));
        polling = startPolling(fetchLogs);
        await flushAsync();
      });

      it('does not poll again immediately', () => {
        expect(fetchLogs.calls.count()).toBe(1);
      });
    });

    describe('cleanup', () => {
      beforeEach(() => {
        polling = startPolling(pendingFetchLogs());
        polling.cleanup();
      });

      it('sets cancelledRef to true', () => {
        expect(polling.cancelledRef.current).toBeTrue();
      });
    });
  });

  describe('#buildScrollEffect', () => {
    it('calls scrollIntoView on the bottomRef element when logs exist', () => {
      const scrollSpy = runScrollEffect([{ id: 1, level: 'info', message: 'x', timestamp: 't' }]);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not call scrollIntoView when there are no logs', () => {
      const scrollSpy = runScrollEffect([]);
      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });
});
