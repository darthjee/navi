import fetchLogs, { fetchJobLogs } from '../../src/clients/LogsClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('LogsClient', () => {
  describe('fetchLogs', () => {
    const logs = [
      { id: 1, level: 'info', message: 'Server started', timestamp: '2024-01-01T00:00:00Z' },
    ];

    describe('without lastId — when the request succeeds', () => {
      mockFetchSuccess(logs);

      it('fetches from /logs.json', async () => {
        await fetchLogs();
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json');
      });

      it('returns the logs array', async () => {
        const result = await fetchLogs();
        expect(result).toEqual(logs);
      });
    });

    describe('without lastId — when the request fails', () => {
      mockFetchFailure(500);

      it('throws an error with the HTTP status code', async () => {
        await expectAsync(fetchLogs()).toBeRejectedWithError('HTTP 500');
      });
    });

    describe('with a numeric lastId', () => {
      mockFetchSuccess([]);

      it('appends last_id to the query string', async () => {
        await fetchLogs({ lastId: 42 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json?last_id=42');
      });
    });

    describe('with a lastId that contains special characters', () => {
      mockFetchSuccess([]);

      it('URI-encodes the lastId value', async () => {
        await fetchLogs({ lastId: 'a b+c' });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json?last_id=a%20b%2Bc');
      });
    });

    describe('with lastId as null', () => {
      mockFetchSuccess([]);

      it('fetches from /logs.json without a query parameter', async () => {
        await fetchLogs({ lastId: null });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json');
      });
    });

    describe('with lastId as undefined', () => {
      mockFetchSuccess([]);

      it('fetches from /logs.json without a query parameter', async () => {
        await fetchLogs({ lastId: undefined });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json');
      });
    });
  });

  describe('fetchJobLogs', () => {
    const logs = [
      { id: 1, level: 'info', message: 'Job started', timestamp: '2024-01-01T00:00:00Z' },
    ];

    describe('without lastId — when the request succeeds', () => {
      mockFetchSuccess(logs);

      it('fetches from /jobs/:jobId/logs.json', async () => {
        await fetchJobLogs('job-1');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/job-1/logs.json');
      });

      it('returns the logs array', async () => {
        const result = await fetchJobLogs('job-1');
        expect(result).toEqual(logs);
      });
    });

    describe('without lastId — when the request fails', () => {
      mockFetchFailure(500);

      it('throws an error with the HTTP status code', async () => {
        await expectAsync(fetchJobLogs('job-1')).toBeRejectedWithError('HTTP 500');
      });
    });

    describe('with a numeric lastId', () => {
      mockFetchSuccess([]);

      it('appends last_id to the query string', async () => {
        await fetchJobLogs('job-1', { lastId: 42 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/job-1/logs.json?last_id=42');
      });
    });

    describe('with a jobId that contains special characters', () => {
      mockFetchSuccess([]);

      it('URI-encodes the jobId', async () => {
        await fetchJobLogs('job 1');
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/job%201/logs.json');
      });
    });

    describe('with lastId as null', () => {
      mockFetchSuccess([]);

      it('fetches without a query parameter', async () => {
        await fetchJobLogs('job-1', { lastId: null });
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/job-1/logs.json');
      });
    });
  });
});
