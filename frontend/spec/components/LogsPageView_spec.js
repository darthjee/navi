import LogsPageController from '../../src/components/controllers/LogsPageController.jsx';
import noop from '../../src/utils/noop.js';

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

describe('LogsPageController', () => {
  describe('.build', () => {
    it('returns a LogsPageController instance', () => {
      const view = LogsPageController.build([]);
      expect(view).toBeInstanceOf(LogsPageController);
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

      beforeEach(async () => {
        let callCount = 0;
        spyOn(globalThis, 'fetch').and.callFake(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(entries) });
          }
          return new Promise(noop);
        });

        cancelledRef = { current: false };
        lastIdRef = { current: null };
        setLogs = jasmine.createSpy('setLogs');

        const view = LogsPageController.build([]);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();
        await flushAsync();
      });

      afterEach(() => { cleanup && cleanup(); });

      it('calls setLogs with the new entries', () => {
        expect(setLogs).toHaveBeenCalled();
      });

      it('updates lastIdRef to the id of the last entry', () => {
        expect(lastIdRef.current).toBe(10);
      });

      it('polls again immediately', () => {
        expect(globalThis.fetch.calls.count()).toBeGreaterThan(1);
      });
    });

    describe('when the response is empty', () => {
      let cleanup;

      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        );

        const cancelledRef = { current: false };
        const lastIdRef = { current: null };
        const setLogs = jasmine.createSpy('setLogs');
        const view = LogsPageController.build([]);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef, setLogs)();
        await flushAsync();
      });

      afterEach(() => { cleanup && cleanup(); });

      it('does not poll again immediately', () => {
        expect(globalThis.fetch.calls.count()).toBe(1);
      });
    });

    describe('cleanup', () => {
      it('sets cancelledRef to true', async () => {
        spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));

        const cancelledRef = { current: false };
        const lastIdRef = { current: null };
        const setLogs = jasmine.createSpy('setLogs');
        const view = LogsPageController.build([]);
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
      const view = LogsPageController.build([{ id: 1, level: 'info', message: 'x', timestamp: 't' }]);

      view.buildScrollEffect(bottomRef)();
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not call scrollIntoView when there are no logs', () => {
      const scrollSpy = jasmine.createSpy('scrollIntoView');
      const bottomRef = { current: { scrollIntoView: scrollSpy } };
      const view = LogsPageController.build([]);

      view.buildScrollEffect(bottomRef)();
      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });
});
