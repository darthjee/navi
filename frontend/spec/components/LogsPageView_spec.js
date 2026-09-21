import LogsPageController from '../../src/components/pages/controllers/LogsPageController.jsx';
import noop from '../../src/utils/noop.js';
import { logEntries, okResponse, resolveOnceThenPend } from '../support/logs.js';

// Plain (not act-wrapped) on purpose: the controller runs outside React.
const flushAsync = () => new Promise((r) => setTimeout(r, 0));

// Starts the polling effect of a fresh controller and returns its refs, the
// setLogs spy and the cleanup function.
const startPolling = () => {
  const cancelledRef = { current: false };
  const lastIdRef = { current: null };
  const setLogs = jasmine.createSpy('setLogs');
  const view = LogsPageController.build([]);
  const cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();

  return { cancelledRef, lastIdRef, setLogs, cleanup };
};

// Runs buildScrollEffect for a controller holding `logs` and returns the
// scrollIntoView spy attached to the bottom ref.
const runScrollEffect = (logs) => {
  const scrollSpy = jasmine.createSpy('scrollIntoView');
  const bottomRef = { current: { scrollIntoView: scrollSpy } };

  LogsPageController.build(logs).buildScrollEffect(bottomRef)();
  return scrollSpy;
};

describe('LogsPageController', () => {
  describe('.build', () => {
    it('returns a LogsPageController instance', () => {
      const view = LogsPageController.build([]);
      expect(view).toBeInstanceOf(LogsPageController);
    });
  });

  describe('#buildPollingEffect', () => {
    describe('when logs are returned on the first poll', () => {
      let polling;

      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.callFake(resolveOnceThenPend(okResponse(logEntries)));
        polling = startPolling();
        await flushAsync();
      });

      afterEach(() => { polling.cleanup(); });

      it('calls setLogs with the new entries', () => {
        expect(polling.setLogs).toHaveBeenCalled();
      });

      it('updates lastIdRef to the id of the last entry', () => {
        expect(polling.lastIdRef.current).toBe(4);
      });

      it('polls again immediately', () => {
        expect(globalThis.fetch.calls.count()).toBeGreaterThan(1);
      });
    });

    describe('when the response is empty', () => {
      let polling;

      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve(okResponse([])));
        polling = startPolling();
        await flushAsync();
      });

      afterEach(() => { polling.cleanup(); });

      it('does not poll again immediately', () => {
        expect(globalThis.fetch.calls.count()).toBe(1);
      });
    });

    describe('cleanup', () => {
      it('sets cancelledRef to true', () => {
        spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));

        const { cancelledRef, cleanup } = startPolling();

        cleanup();
        expect(cancelledRef.current).toBeTrue();
      });
    });
  });

  describe('#buildScrollEffect', () => {
    it('calls scrollIntoView on the bottomRef element when logs exist', () => {
      const scrollSpy = runScrollEffect(logEntries);

      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not call scrollIntoView when there are no logs', () => {
      const scrollSpy = runScrollEffect([]);

      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });
});
