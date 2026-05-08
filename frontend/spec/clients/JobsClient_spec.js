import { fetchJobs, fetchJobsByStatus, STATUSES } from '../../src/clients/JobsClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('JobsClient', () => {
  describe('STATUSES', () => {
    it('contains the five job statuses', () => {
      expect(STATUSES).toEqual(['enqueued', 'processing', 'failed', 'finished', 'dead']);
    });
  });

  describe('fetchJobsByStatus', () => {
    const jobs = [{ id: 'abc', status: 'enqueued', attempts: 0 }];

    describe('when the request succeeds', () => {
      mockFetchSuccess(jobs);

      it('fetches from /jobs/:status.json', async () => {
        await fetchJobsByStatus('enqueued');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/enqueued.json');
      });

      it('returns the jobs array', async () => {
        const result = await fetchJobsByStatus('enqueued');
        expect(result).toEqual(jobs);
      });

      it('appends the filter query to the URL when provided', async () => {
        await fetchJobsByStatus('enqueued', 'filters[class][]=ResourceRequestJob');
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/jobs/enqueued.json?filters[class][]=ResourceRequestJob'
        );
      });
    });

    describe('when the request fails', () => {
      mockFetchFailure(503);

      it('throws an error with the status code', async () => {
        await expectAsync(fetchJobsByStatus('enqueued')).toBeRejectedWithError('HTTP 503');
      });
    });
  });

  describe('fetchJobs', () => {
    describe('when all requests succeed', () => {
      const enqueuedJobs = [{ id: 'a', status: 'enqueued', attempts: 0 }];
      const processingJobs = [{ id: 'b', status: 'processing', attempts: 1 }];
      const failedJobs = [{ id: 'c', status: 'failed', attempts: 2 }];
      const finishedJobs = [{ id: 'd', status: 'finished', attempts: 1 }];
      const deadJobs = [{ id: 'e', status: 'dead', attempts: 3 }];

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.callFake((url) => {
          const map = {
            '/jobs/enqueued.json':   enqueuedJobs,
            '/jobs/processing.json': processingJobs,
            '/jobs/failed.json':     failedJobs,
            '/jobs/finished.json':   finishedJobs,
            '/jobs/dead.json':       deadJobs,
          };
          return Promise.resolve({ ok: true, json: () => Promise.resolve(map[url] ?? []) });
        });
      });

      it('fetches all five status endpoints', async () => {
        await fetchJobs();
        expect(globalThis.fetch).toHaveBeenCalledTimes(5);
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/enqueued.json');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/processing.json');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/failed.json');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/finished.json');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/dead.json');
      });

      it('returns a flat array of all jobs', async () => {
        const result = await fetchJobs();
        expect(result).toEqual([
          ...enqueuedJobs,
          ...processingJobs,
          ...failedJobs,
          ...finishedJobs,
          ...deadJobs,
        ]);
      });

      it('appends the filter query to all status URLs when provided', async () => {
        await fetchJobs('filters[class][]=ResourceRequestJob');
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/jobs/enqueued.json?filters[class][]=ResourceRequestJob'
        );
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/jobs/dead.json?filters[class][]=ResourceRequestJob'
        );
      });
    });

    describe('when one request fails', () => {
      mockFetchFailure(500);

      it('rejects with the error', async () => {
        await expectAsync(fetchJobs()).toBeRejectedWithError('HTTP 500');
      });
    });
  });
});
