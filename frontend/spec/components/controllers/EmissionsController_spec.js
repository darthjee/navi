import EmissionsController from '../../../src/components/pages/controllers/EmissionsController.jsx';
import noop from '../../../src/utils/noop.js';

const flushAsync = () => new Promise((r) => setTimeout(r, 0));
const flushMany = async (times = 5) => {
  for (let i = 0; i < times; i += 1) {
    await flushAsync();
  }
};

const mockResponses = (payloads) => {
  let call = 0;
  spyOn(globalThis, 'fetch').and.callFake(() => {
    const payload = payloads[Math.min(call, payloads.length - 1)];
    call += 1;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
  });
};

describe('EmissionsController', () => {
  describe('.build', () => {
    it('returns an EmissionsController instance', () => {
      const view = EmissionsController.build(noop, noop, noop);
      expect(view).toBeInstanceOf(EmissionsController);
    });
  });

  describe('#buildPollingEffect', () => {
    let setData;
    let setError;
    let setLoading;
    let cancelledRef;
    let lastIdRef;
    let cleanup;

    beforeEach(() => {
      setData = jasmine.createSpy('setData');
      setError = jasmine.createSpy('setError');
      setLoading = jasmine.createSpy('setLoading');
      cancelledRef = { current: false };
      lastIdRef = { current: null };
    });

    afterEach(() => { cleanup && cleanup(); });

    describe('when emissions are returned on the first poll', () => {
      const first = {
        counts: { extracted: 4, emitted: 3, failed: 1, dead: 0 },
        emissions: [
          { id: 5, status: 'success', url: 'https://a', method: 'POST' },
          { id: 6, status: 'failed', url: 'https://b', method: 'POST' },
        ],
      };

      beforeEach(async () => {
        mockResponses([first, { counts: first.counts, emissions: [] }]);
        const view = EmissionsController.build(setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany();
      });

      it('fetches the emissions feed', () => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/emissions.json');
      });

      it('stops the loading state', () => {
        expect(setLoading).toHaveBeenCalledWith(false);
      });

      it('clears any previous error', () => {
        expect(setError).toHaveBeenCalledWith(null);
      });

      it('passes the counts and rows to setData', () => {
        const lastArg = setData.calls.mostRecent().args[0];
        expect(lastArg.counts).toEqual(first.counts);
        expect(lastArg.rows.map((row) => row.id)).toEqual([5, 6]);
      });

      it('advances the cursor to the last emission id', () => {
        expect(lastIdRef.current).toBe(6);
      });

      it('polls again immediately after a non-empty batch', () => {
        expect(globalThis.fetch.calls.count()).toBeGreaterThan(1);
      });
    });

    describe('when subsequent polls append more rows', () => {
      beforeEach(async () => {
        mockResponses([
          { counts: { extracted: 2 }, emissions: [{ id: 1, status: 'success' }, { id: 2, status: 'success' }] },
          { counts: { extracted: 4 }, emissions: [{ id: 3, status: 'failed' }, { id: 4, status: 'dead' }] },
          { counts: { extracted: 4 }, emissions: [] },
        ]);
        const view = EmissionsController.build(setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany(8);
      });

      it('accumulates rows across polls', () => {
        const lastArg = setData.calls.mostRecent().args[0];
        expect(lastArg.rows.map((row) => row.id)).toEqual([1, 2, 3, 4]);
      });

      it('advances the cursor to the newest id', () => {
        expect(lastIdRef.current).toBe(4);
      });
    });

    describe('when the response is empty', () => {
      beforeEach(async () => {
        mockResponses([{ counts: { extracted: 0 }, emissions: [] }]);
        const view = EmissionsController.build(setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany();
      });

      it('does not poll again immediately', () => {
        expect(globalThis.fetch.calls.count()).toBe(1);
      });

      it('still reports the counts', () => {
        expect(setData.calls.mostRecent().args[0].counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
      });
    });

    describe('when the fetch fails', () => {
      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({ ok: false, status: 503 }));
        const view = EmissionsController.build(setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany();
      });

      it('reports the error message', () => {
        expect(setError).toHaveBeenCalledWith('HTTP 503');
      });

      it('stops the loading state', () => {
        expect(setLoading).toHaveBeenCalledWith(false);
      });
    });

    describe('cleanup', () => {
      it('marks the poll loop as cancelled', () => {
        spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
        const view = EmissionsController.build(setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        cleanup();
        expect(cancelledRef.current).toBeTrue();
      });
    });
  });
});
