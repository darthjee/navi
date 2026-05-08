import fetchStats from '../../src/clients/StatsClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('StatsClient', () => {
  describe('fetchStats', () => {
    describe('when the request succeeds with full data', () => {
      const data = {
        workers: { idle: 3, busy: 1 },
        jobs: { enqueued: 5, processing: 2, failed: 1, finished: 10, dead: 0 },
      };

      mockFetchSuccess(data);

      it('returns the workers stats', async () => {
        const result = await fetchStats();
        expect(result.workers).toEqual({ idle: 3, busy: 1 });
      });

      it('returns the jobs stats', async () => {
        const result = await fetchStats();
        expect(result.jobs).toEqual({ enqueued: 5, processing: 2, failed: 1, finished: 10, dead: 0 });
      });

      it('fetches from /stats.json', async () => {
        await fetchStats();
        expect(globalThis.fetch).toHaveBeenCalledWith('/stats.json');
      });
    });

    describe('when the request succeeds with missing workers data', () => {
      mockFetchSuccess({ jobs: {} });

      it('fills missing worker fields with defaults', async () => {
        const result = await fetchStats();
        expect(result.workers).toEqual({ idle: 0, busy: 0 });
      });
    });

    describe('when the request succeeds with missing jobs data', () => {
      mockFetchSuccess({ workers: {} });

      it('fills missing job fields with defaults', async () => {
        const result = await fetchStats();
        expect(result.jobs).toEqual({ enqueued: 0, processing: 0, failed: 0, finished: 0, dead: 0 });
      });
    });

    describe('when the request succeeds with an empty response', () => {
      mockFetchSuccess({});

      it('returns default workers', async () => {
        const result = await fetchStats();
        expect(result.workers).toEqual({ idle: 0, busy: 0 });
      });

      it('returns default jobs', async () => {
        const result = await fetchStats();
        expect(result.jobs).toEqual({ enqueued: 0, processing: 0, failed: 0, finished: 0, dead: 0 });
      });
    });

    describe('when the request succeeds with partial workers data', () => {
      mockFetchSuccess({ workers: { idle: 5 } });

      it('merges provided values with defaults', async () => {
        const result = await fetchStats();
        expect(result.workers).toEqual({ idle: 5, busy: 0 });
      });
    });

    describe('when the request fails with a 500 status', () => {
      mockFetchFailure(500);

      it('throws an error with the status code', async () => {
        await expectAsync(fetchStats()).toBeRejectedWithError('HTTP 500');
      });
    });

    describe('when the request fails with a 503 status', () => {
      mockFetchFailure(503);

      it('throws an error with the status code', async () => {
        await expectAsync(fetchStats()).toBeRejectedWithError('HTTP 503');
      });
    });
  });
});
