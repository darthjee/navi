import MenuClient from '../../src/clients/MenuClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('MenuClient', () => {
  describe('.fetchEntries', () => {
    describe('when the request succeeds with entries and hidden', () => {
      mockFetchSuccess({
        entries: [{ route: '/logs', text: 'Logs' }],
        hidden: ['/ext/reports'],
      });

      it('returns the entries and hidden arrays', async () => {
        const result = await MenuClient.fetchEntries();
        expect(result).toEqual({
          entries: [{ route: '/logs', text: 'Logs' }],
          hidden: ['/ext/reports'],
        });
      });

      it('fetches from /menu.json', async () => {
        await MenuClient.fetchEntries();
        expect(globalThis.fetch).toHaveBeenCalledWith('/menu.json');
      });
    });

    describe('when the request succeeds without entries or hidden keys', () => {
      mockFetchSuccess({});

      it('returns empty arrays', async () => {
        const result = await MenuClient.fetchEntries();
        expect(result).toEqual({ entries: [], hidden: [] });
      });
    });

    describe('when the request fails', () => {
      mockFetchFailure(500);

      it('throws an error with the status code', async () => {
        await expectAsync(MenuClient.fetchEntries()).toBeRejectedWithError('HTTP 500');
      });
    });
  });
});
