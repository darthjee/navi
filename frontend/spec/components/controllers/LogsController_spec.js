import LogsController from '../../../src/components/elements/controllers/LogsController.jsx';
import noop from '../../../src/utils/noop.js';

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

describe('LogsController', () => {
  describe('.build', () => {
    it('returns a LogsController instance', () => {
      const fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(new Promise(noop));
      const view = LogsController.build([], fetchLogs);
      expect(view).toBeInstanceOf(LogsController);
    });
  });

  describe('#buildPollingEffect', () => {
    describe('when logs are returned on the first poll', () => {
      const entries = [
        { id: 10, level: 'info', message: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
      ];

      let cancelledRef;
      let lastIdRef;
      let setLogs;
      let cleanup;
      let fetchLogs;

      beforeEach(async () => {
        let callCount = 0;
        fetchLogs = jasmine.createSpy('fetchLogs').and.callFake(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve(entries);
          return new Promise(noop);
        });

        cancelledRef = { current: false };
        lastIdRef = { current: null };
        setLogs = jasmine.createSpy('setLogs');

        const view = LogsController.build([], fetchLogs);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();
        await flushAsync();
      });

      afterEach(() => { cleanup && cleanup(); });

      it('calls fetchLogs with the current lastId', () => {
        expect(fetchLogs).toHaveBeenCalledWith({ lastId: null });
      });

      it('calls setLogs with the new entries', () => {
        expect(setLogs).toHaveBeenCalled();
      });

      it('updates lastIdRef to the id of the last entry', () => {
        expect(lastIdRef.current).toBe(10);
      });

      it('polls again immediately', () => {
        expect(fetchLogs.calls.count()).toBeGreaterThan(1);
      });
    });

    describe('when the response is empty', () => {
      let cleanup;
      let fetchLogs;

      beforeEach(async () => {
        fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(Promise.resolve([]));

        const cancelledRef = { current: false };
        const lastIdRef = { current: null };
        const setLogs = jasmine.createSpy('setLogs');
        const view = LogsController.build([], fetchLogs);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();
        await flushAsync();
      });

      afterEach(() => { cleanup && cleanup(); });

      it('does not poll again immediately', () => {
        expect(fetchLogs.calls.count()).toBe(1);
      });
    });

    describe('cleanup', () => {
      it('sets cancelledRef to true', async () => {
        const fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(new Promise(noop));
        const cancelledRef = { current: false };
        const lastIdRef = { current: null };
        const setLogs = jasmine.createSpy('setLogs');
        const view = LogsController.build([], fetchLogs);
        const cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();

        cleanup();
        expect(cancelledRef.current).toBeTrue();
      });
    });
  });

  describe('#buildScrollEffect', () => {
    it('calls scrollIntoView on the bottomRef element when logs exist', () => {
      const scrollSpy = jasmine.createSpy('scrollIntoView');
      const bottomRef = { current: { scrollIntoView: scrollSpy } };
      const fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(new Promise(noop));
      const view = LogsController.build(
        [{ id: 1, level: 'info', message: 'x', timestamp: 't' }],
        fetchLogs
      );

      view.buildScrollEffect(bottomRef)();
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not call scrollIntoView when there are no logs', () => {
      const scrollSpy = jasmine.createSpy('scrollIntoView');
      const bottomRef = { current: { scrollIntoView: scrollSpy } };
      const fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(new Promise(noop));
      const view = LogsController.build([], fetchLogs);

      view.buildScrollEffect(bottomRef)();
      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });
});
