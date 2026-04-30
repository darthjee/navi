import { fetchJobs, fetchJobsByStatus, STATUSES } from '../../src/clients/JobsClient.js';

describe('JobsClient', () => {
  describe('STATUSES', () => {
    it('contains the five job statuses', () => {
      expect(STATUSES).toEqual(['enqueued', 'processing', 'failed', 'finished', 'dead']);
    });
  });

  describe('fetchJobsByStatus', () => {
    describe('when the request succeeds', () => {
      const jobs = [{ id: 'abc', status: 'enqueued', attempts: 0 }];

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve(jobs) })
        );
      });

      it('fetches from /jobs/:status.json', async () => {
        await fetchJobsByStatus('enqueued');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/enqueued.json');
      });

      it('returns the jobs array', async () => {
        const result = await fetchJobsByStatus('enqueued');
        expect(result).toEqual(jobs);
      });

      describe('when a filter query is provided', () => {
        it('appends the filter query to the URL', async () => {
          await fetchJobsByStatus('enqueued', 'filters[class][]=ResourceRequestJob');
          expect(globalThis.fetch).toHaveBeenCalledWith(
            '/jobs/enqueued.json?filters[class][]=ResourceRequestJob'
          );
        });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 503 })
        );
      });

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

      describe('when a filter query is provided', () => {
        it('appends the filter query to all status URLs', async () => {
          await fetchJobs('filters[class][]=ResourceRequestJob');
          expect(globalThis.fetch).toHaveBeenCalledWith(
            '/jobs/enqueued.json?filters[class][]=ResourceRequestJob'
          );
          expect(globalThis.fetch).toHaveBeenCalledWith(
            '/jobs/dead.json?filters[class][]=ResourceRequestJob'
          );
        });
      });
    });

    describe('when one request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 500 })
        );
      });

      it('rejects with the error', async () => {
        await expectAsync(fetchJobs()).toBeRejectedWithError('HTTP 500');
      });
    });
  });
});

