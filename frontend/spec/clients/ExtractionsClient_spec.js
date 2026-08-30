import fetchExtractions from '../../src/clients/ExtractionsClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('ExtractionsClient', () => {
  describe('fetchExtractions', () => {
    const body = {
      counts: { extracted: 20 },
      extractions: [
        { id: 1, parserType: 'json', originUrl: 'https://example.com/list', itemCount: 20 },
      ],
    };

    describe('without lastId — when the request succeeds', () => {
      mockFetchSuccess(body);

      it('fetches from /extractions.json', async () => {
        await fetchExtractions();
        expect(globalThis.fetch).toHaveBeenCalledWith('/extractions.json');
      });

      it('returns the parsed body', async () => {
        const result = await fetchExtractions();
        expect(result).toEqual(body);
      });
    });

    describe('without lastId — when the request fails', () => {
      mockFetchFailure(500);

      it('throws an error with the HTTP status code', async () => {
        await expectAsync(fetchExtractions()).toBeRejectedWithError('HTTP 500');
      });
    });

    describe('with a numeric lastId', () => {
      mockFetchSuccess(body);

      it('appends last_id to the query string', async () => {
        await fetchExtractions({ lastId: 42 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/extractions.json?last_id=42');
      });
    });

    describe('with a lastId that contains special characters', () => {
      mockFetchSuccess(body);

      it('URI-encodes the lastId value', async () => {
        await fetchExtractions({ lastId: 'a b+c' });
        expect(globalThis.fetch).toHaveBeenCalledWith('/extractions.json?last_id=a%20b%2Bc');
      });
    });

    describe('with lastId as null', () => {
      mockFetchSuccess(body);

      it('fetches from /extractions.json without a query parameter', async () => {
        await fetchExtractions({ lastId: null });
        expect(globalThis.fetch).toHaveBeenCalledWith('/extractions.json');
      });
    });

    describe('with lastId as undefined', () => {
      mockFetchSuccess(body);

      it('fetches from /extractions.json without a query parameter', async () => {
        await fetchExtractions({ lastId: undefined });
        expect(globalThis.fetch).toHaveBeenCalledWith('/extractions.json');
      });
    });
  });
});
