import LinksClient from '../../src/clients/LinksClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('LinksClient', () => {
  describe('.fetchLinks', () => {
    describe('when the request succeeds with links', () => {
      mockFetchSuccess({ links: [{ text: 'Docs', url: 'https://example.com/docs' }] });

      it('returns the links array', async () => {
        const result = await LinksClient.fetchLinks();
        expect(result).toEqual([{ text: 'Docs', url: 'https://example.com/docs' }]);
      });

      it('fetches from /links.json', async () => {
        await LinksClient.fetchLinks();
        expect(globalThis.fetch).toHaveBeenCalledWith('/links.json');
      });
    });

    describe('when the request succeeds without links key', () => {
      mockFetchSuccess({});

      it('returns an empty array', async () => {
        const result = await LinksClient.fetchLinks();
        expect(result).toEqual([]);
      });
    });

    describe('when the request fails', () => {
      mockFetchFailure(500);

      it('throws an error with the status code', async () => {
        await expectAsync(LinksClient.fetchLinks()).toBeRejectedWithError('HTTP 500');
      });
    });
  });
});
