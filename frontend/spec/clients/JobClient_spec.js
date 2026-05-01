import fetchJob, { retryJob } from '../../src/clients/JobClient.js';

describe('JobClient', () => {
  describe('fetchJob', () => {
    describe('when the job exists', () => {
      const job = { id: 'abc-123', status: 'processing', attempts: 1 };

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(job) })
        );
      });

      it('fetches from /job/:id.json', async () => {
        await fetchJob('abc-123');
        expect(globalThis.fetch).toHaveBeenCalledWith('/job/abc-123.json');
      });

      it('returns the job object', async () => {
        const result = await fetchJob('abc-123');
        expect(result).toEqual(job);
      });
    });

    describe('when the job does not exist', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 404, json: jasmine.createSpy('json') })
        );
      });

      it('returns null', async () => {
        const result = await fetchJob('nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('when the request fails with a server error', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 500 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(fetchJob('abc-123')).toBeRejectedWithError('HTTP 500');
      });
    });
  });

  describe('retryJob', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'enqueued' }) })
        );
      });

      it('sends a PATCH to /jobs/:id/retry', async () => {
        await retryJob('abc-123');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/abc-123/retry', { method: 'PATCH' });
      });

      it('returns the response JSON', async () => {
        const result = await retryJob('abc-123');
        expect(result).toEqual({ status: 'enqueued' });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 409 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(retryJob('abc-123')).toBeRejectedWithError('HTTP 409');
      });
    });
  });
});
