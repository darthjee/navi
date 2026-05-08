import BaseUrlsClient from '../../src/clients/BaseUrlsClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('BaseUrlsClient', () => {
  describe('.fetchBaseUrls', () => {
    describe('when the request succeeds with a list of base URLs', () => {
      mockFetchSuccess({ base_urls: ['https://example.com', 'https://other.com'] });

      it('returns the array of base URLs', async () => {
        const result = await BaseUrlsClient.fetchBaseUrls();
        expect(result).toEqual(['https://example.com', 'https://other.com']);
      });

      it('fetches from /clients/base_urls.json', async () => {
        await BaseUrlsClient.fetchBaseUrls();
        expect(globalThis.fetch).toHaveBeenCalledWith('/clients/base_urls.json');
      });
    });

    describe('when the request succeeds with an empty list', () => {
      mockFetchSuccess({ base_urls: [] });

      it('returns an empty array', async () => {
        const result = await BaseUrlsClient.fetchBaseUrls();
        expect(result).toEqual([]);
      });
    });

    describe('when the request succeeds with missing base_urls key', () => {
      mockFetchSuccess({});

      it('returns an empty array', async () => {
        const result = await BaseUrlsClient.fetchBaseUrls();
        expect(result).toEqual([]);
      });
    });

    describe('when the request fails', () => {
      mockFetchFailure(503);

      it('throws an error with the status code', async () => {
        await expectAsync(BaseUrlsClient.fetchBaseUrls()).toBeRejectedWithError('HTTP 503');
      });
    });
  });
});
