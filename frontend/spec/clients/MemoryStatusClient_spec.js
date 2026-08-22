import fetchMemoryStatus from '../../src/clients/MemoryStatusClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('MemoryStatusClient', () => {
  describe('fetchMemoryStatus', () => {
    describe('when the request succeeds', () => {
      const data = {
        current: 89128960,
        maximum: 104857600,
        percentage: 85,
        status: 'high',
      };

      mockFetchSuccess(data);

      it('returns the parsed JSON as-is', async () => {
        const result = await fetchMemoryStatus();
        expect(result).toEqual(data);
      });

      it('fetches from /memory/status.json', async () => {
        await fetchMemoryStatus();
        expect(globalThis.fetch).toHaveBeenCalledWith('/memory/status.json');
      });
    });

    describe('when the request fails with a 500 status', () => {
      mockFetchFailure(500);

      it('throws an error with the status code', async () => {
        await expectAsync(fetchMemoryStatus()).toBeRejectedWithError('HTTP 500');
      });
    });

    describe('when the request fails with a 503 status', () => {
      mockFetchFailure(503);

      it('throws an error with the status code', async () => {
        await expectAsync(fetchMemoryStatus()).toBeRejectedWithError('HTTP 503');
      });
    });
  });
});
