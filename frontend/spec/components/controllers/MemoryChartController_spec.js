import { act } from 'react';
import MemoryChartController from '../../../src/components/elements/controllers/MemoryChartController.jsx';
import fetchMemoryHistory from '../../../src/clients/MemoryHistoryClient.js';
import noop from '../../../src/utils/noop.js';
import { mockFetchFailure } from '../../support/fetch.js';

const MAX_POINTS = 200;

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const flushMany = async (times = 5) => {
  for (let i = 0; i < times; i += 1) {
    await flushAsync();
  }
};

// Stubs globalThis.fetch with a bounded sequence of successful, oldest-first
// entry batches. The final payload is repeated for any extra call, so it must
// be an empty batch to stop the controller's immediate re-poll on success.
const mockResponses = (payloads) => {
  let call = 0;
  spyOn(globalThis, 'fetch').and.callFake(() => {
    const payload = payloads[Math.min(call, payloads.length - 1)];
    call += 1;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
  });
};

const batch = (start, count) => Array.from({ length: count }, (_, i) => ({
  id: start + i,
  value: start + i,
  percentage: 1,
  timestamp: `2026-09-01T00:00:${String(start + i).padStart(2, '0')}Z`,
}));

describe('MemoryChartController', () => {
  describe('.build', () => {
    it('returns a MemoryChartController instance', () => {
      const view = MemoryChartController.build(noop, noop, noop, noop);
      expect(view).toBeInstanceOf(MemoryChartController);
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

    describe('when entries are returned on the first poll', () => {
      const first = batch(1, 2);

      beforeEach(async () => {
        mockResponses([first, []]);
        const view = MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany();
      });

      it('fetches the memory history feed', () => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/memory/history.json');
      });

      it('stops the loading state', () => {
        expect(setLoading).toHaveBeenCalledWith(false);
      });

      it('clears any previous error', () => {
        expect(setError).toHaveBeenCalledWith(null);
      });

      it('passes the accumulated points to setData', () => {
        const lastArg = setData.calls.mostRecent().args[0];
        expect(lastArg.map((point) => point.id)).toEqual([1, 2]);
      });

      it('advances the cursor to the last entry id', () => {
        expect(lastIdRef.current).toBe(2);
      });
    });

    describe('when a subsequent poll returns new entries', () => {
      beforeEach(async () => {
        mockResponses([
          [{ id: 1, value: 100, percentage: 10, timestamp: 't1' }],
          [{ id: 2, value: 110, percentage: 11, timestamp: 't2' }],
          [],
        ]);
        const view = MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany(8);
      });

      it('requests the next batch using the last_id cursor', () => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/memory/history.json?last_id=1');
      });

      it('appends the new entries to the accumulated points', () => {
        const lastArg = setData.calls.mostRecent().args[0];
        expect(lastArg.map((point) => point.id)).toEqual([1, 2]);
      });

      it('advances the cursor to the newest id', () => {
        expect(lastIdRef.current).toBe(2);
      });
    });

    describe('when more than MAX_POINTS entries accumulate', () => {
      beforeEach(async () => {
        mockResponses([batch(1, 100), batch(101, 100), batch(201, 50), []]);
        const view = MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushMany(10);
      });

      it('caps the accumulated points at MAX_POINTS', () => {
        const lastArg = setData.calls.mostRecent().args[0];
        expect(lastArg.length).toBe(MAX_POINTS);
      });

      it('keeps only the newest points after capping', () => {
        const lastArg = setData.calls.mostRecent().args[0];
        expect(lastArg[0].id).toBe(51);
        expect(lastArg[lastArg.length - 1].id).toBe(250);
      });
    });

    describe('when the fetch fails', () => {
      mockFetchFailure(503);

      beforeEach(async () => {
        const view = MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushAsync();
      });

      it('reports the error message', () => {
        expect(setError).toHaveBeenCalledWith('HTTP 503');
      });

      it('stops the loading state', () => {
        expect(setLoading).toHaveBeenCalledWith(false);
      });
    });

    describe('when the fetch fails and then recovers', () => {
      beforeEach(async () => {
        let call = 0;
        spyOn(globalThis, 'fetch').and.callFake(() => {
          call += 1;
          if (call === 1) {
            return Promise.resolve({ ok: false, status: 503 });
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });

        const view = MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        await flushAsync();
      });

      it('reports the error message on the failed poll', () => {
        expect(setError).toHaveBeenCalledWith('HTTP 503');
      });

      describe('once the retry poll succeeds', () => {
        beforeEach(async () => {
          // The controller retries the failed poll after POLL_DELAY_MS (1000ms)
          // using a real setTimeout, so wait past that delay before flushing.
          await act(async () => { await new Promise((r) => setTimeout(r, 1050)); });
        });

        it('clears the error', () => {
          expect(setError).toHaveBeenCalledWith(null);
        });
      });
    });

    describe('cleanup', () => {
      it('marks the poll loop as cancelled', () => {
        spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
        const view = MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading);
        cleanup = view.buildPollingEffect(cancelledRef, lastIdRef)();
        cleanup();
        expect(cancelledRef.current).toBeTrue();
      });
    });
  });
});
