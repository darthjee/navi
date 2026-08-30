import fetchEmissions from '../../src/clients/EmissionsClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('EmissionsClient', () => {
  describe('fetchEmissions', () => {
    const body = {
      counts: { extracted: 4, emitted: 3, failed: 1, dead: 0 },
      emissions: [
        { id: 1, extractionId: 7, status: 'success', url: 'https://example.com', method: 'POST' },
      ],
    };

    describe('without lastId — when the request succeeds', () => {
      mockFetchSuccess(body);

      it('fetches from /emissions.json', async () => {
        await fetchEmissions();
        expect(globalThis.fetch).toHaveBeenCalledWith('/emissions.json');
      });

      it('returns the parsed body', async () => {
        const result = await fetchEmissions();
        expect(result).toEqual(body);
      });
    });

    describe('without lastId — when the request fails', () => {
      mockFetchFailure(500);

      it('throws an error with the HTTP status code', async () => {
        await expectAsync(fetchEmissions()).toBeRejectedWithError('HTTP 500');
      });
    });

    describe('with a numeric lastId', () => {
      mockFetchSuccess(body);

      it('appends last_id to the query string', async () => {
        await fetchEmissions({ lastId: 42 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/emissions.json?last_id=42');
      });
    });

    describe('with a lastId that contains special characters', () => {
      mockFetchSuccess(body);

      it('URI-encodes the lastId value', async () => {
        await fetchEmissions({ lastId: 'a b+c' });
        expect(globalThis.fetch).toHaveBeenCalledWith('/emissions.json?last_id=a%20b%2Bc');
      });
    });

    describe('with lastId as null', () => {
      mockFetchSuccess(body);

      it('fetches from /emissions.json without a query parameter', async () => {
        await fetchEmissions({ lastId: null });
        expect(globalThis.fetch).toHaveBeenCalledWith('/emissions.json');
      });
    });

    describe('with lastId as undefined', () => {
      mockFetchSuccess(body);

      it('fetches from /emissions.json without a query parameter', async () => {
        await fetchEmissions({ lastId: undefined });
        expect(globalThis.fetch).toHaveBeenCalledWith('/emissions.json');
      });
    });
  });
});
