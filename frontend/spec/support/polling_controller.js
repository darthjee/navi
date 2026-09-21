import { flushMany } from './async.js';
import { useControllerState } from './controller_state.js';
import { mockFetchFailure, mockResponses } from './fetch.js';
import noop from '../../src/utils/noop.js';

// Registers the spies/refs and the cleanup for a polling controller spec.
// Call it inside the `#buildPollingEffect` describe. Returns `state` (the
// spies and refs) and `start`, which builds the controller and runs the effect.
const usePollingController = (build) => {
  const state = useControllerState();
  let cleanup;

  const start = () => {
    const controller = build(state.setData, state.setError, state.setLoading);
    cleanup = controller.buildPollingEffect(state.cancelledRef, state.lastIdRef)();
    return cleanup;
  };

  afterEach(() => { cleanup && cleanup(); });

  return { state, start };
};

// Shared example for controllers that poll a feed and accumulate its entries.
// Options:
//   url          - the feed URL that must be fetched
//   payload      - wraps a list of entries in the feed's response shape
//   entry        - builds one feed entry from its id
//   idsOf        - extracts the accumulated ids from the argument given to setData
const itBehavesLikePollingController = ({ state, start }, { url, payload, entry, idsOf }) => {
  const lastSetDataArg = () => state.setData.calls.mostRecent().args[0];

  describe('when entries are returned on the first poll', () => {
    beforeEach(async () => {
      mockResponses([payload([entry(1), entry(2)]), payload([])]);
      start();
      await flushMany();
    });

    it('fetches the feed', () => {
      expect(globalThis.fetch).toHaveBeenCalledWith(url);
    });

    it('stops the loading state', () => {
      expect(state.setLoading).toHaveBeenCalledWith(false);
    });

    it('clears any previous error', () => {
      expect(state.setError).toHaveBeenCalledWith(null);
    });

    it('passes the accumulated rows to setData', () => {
      expect(idsOf(lastSetDataArg())).toEqual([1, 2]);
    });

    it('advances the cursor to the last entry id', () => {
      expect(state.lastIdRef.current).toBe(2);
    });

    it('polls again immediately after a non-empty batch', () => {
      expect(globalThis.fetch.calls.count()).toBeGreaterThan(1);
    });
  });

  describe('when subsequent polls append more rows', () => {
    beforeEach(async () => {
      mockResponses([
        payload([entry(1), entry(2)]),
        payload([entry(3), entry(4)]),
        payload([]),
      ]);
      start();
      await flushMany(8);
    });

    it('accumulates rows across polls', () => {
      expect(idsOf(lastSetDataArg())).toEqual([1, 2, 3, 4]);
    });

    it('advances the cursor to the newest id', () => {
      expect(state.lastIdRef.current).toBe(4);
    });
  });

  describe('when the response is empty', () => {
    beforeEach(async () => {
      mockResponses([payload([])]);
      start();
      await flushMany();
    });

    it('does not poll again immediately', () => {
      expect(globalThis.fetch.calls.count()).toBe(1);
    });
  });

  describe('when the fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(async () => {
      start();
      await flushMany();
    });

    it('reports the error message', () => {
      expect(state.setError).toHaveBeenCalledWith('HTTP 503');
    });

    it('stops the loading state', () => {
      expect(state.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('cleanup', () => {
    it('marks the poll loop as cancelled', () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      start()();
      expect(state.cancelledRef.current).toBeTrue();
    });
  });
};

export { itBehavesLikePollingController, usePollingController };
