import { act } from 'react';
import fetchMemoryHistory from '../../../src/clients/MemoryHistoryClient.js';
import MemoryChartController from '../../../src/components/elements/controllers/MemoryChartController.jsx';
import noop from '../../../src/utils/noop.js';
import { flushAsync, flushMany } from '../../support/async.js';
import { mockResponses } from '../../support/fetch.js';
import { itBehavesLikePollingController, usePollingController } from '../../support/polling_controller.js';

const MAX_POINTS = 200;

const entry = (id) => ({
  id,
  value: id,
  percentage: 1,
  timestamp: `2026-09-01T00:00:${String(id).padStart(2, '0')}Z`,
});

const batch = (start, count) => Array.from({ length: count }, (_, i) => entry(start + i));

const build = (setData, setError, setLoading) => (
  MemoryChartController.build(fetchMemoryHistory, setData, setError, setLoading)
);

describe('MemoryChartController', () => {
  describe('.build', () => {
    it('returns a MemoryChartController instance', () => {
      const view = MemoryChartController.build(noop, noop, noop, noop);
      expect(view).toBeInstanceOf(MemoryChartController);
    });
  });

  describe('#buildPollingEffect', () => {
    const polling = usePollingController(build);
    const { state, start } = polling;

    itBehavesLikePollingController(polling, {
      url: '/memory/history.json',
      payload: (entries) => entries,
      entry,
      idsOf: (points) => points.map((point) => point.id),
    });

    describe('when a subsequent poll returns new entries', () => {
      beforeEach(async () => {
        mockResponses([
          [{ id: 1, value: 100, percentage: 10, timestamp: 't1' }],
          [{ id: 2, value: 110, percentage: 11, timestamp: 't2' }],
          [],
        ]);
        start();
        await flushMany(8);
      });

      it('requests the next batch using the last_id cursor', () => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/memory/history.json?last_id=1');
      });
    });

    describe('when more than MAX_POINTS entries accumulate', () => {
      beforeEach(async () => {
        mockResponses([batch(1, 100), batch(101, 100), batch(201, 50), []]);
        start();
        await flushMany(10);
      });

      it('caps the accumulated points at MAX_POINTS', () => {
        const lastArg = state.setData.calls.mostRecent().args[0];
        expect(lastArg.length).toBe(MAX_POINTS);
      });

      it('keeps only the newest points after capping', () => {
        const lastArg = state.setData.calls.mostRecent().args[0];
        expect(lastArg[0].id).toBe(51);
        expect(lastArg[lastArg.length - 1].id).toBe(250);
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

        start();
        await flushAsync();
      });

      it('reports the error message on the failed poll', () => {
        expect(state.setError).toHaveBeenCalledWith('HTTP 503');
      });

      describe('once the retry poll succeeds', () => {
        beforeEach(async () => {
          // The controller retries the failed poll after POLL_DELAY_MS (1000ms)
          // using a real setTimeout, so wait past that delay before flushing.
          await act(async () => { await new Promise((r) => setTimeout(r, 1050)); });
        });

        it('clears the error', () => {
          expect(state.setError).toHaveBeenCalledWith(null);
        });
      });
    });
  });
});
