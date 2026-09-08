import MenuClient from '../../src/clients/MenuClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

describe('MenuClient', () => {
  describe('.fetchEntries', () => {
    describe('when the request succeeds with entries', () => {
      mockFetchSuccess({ entries: [{ route: '/logs', text: 'Logs' }] });

      it('returns the entries array', async () => {
        const result = await MenuClient.fetchEntries();
        expect(result).toEqual([{ route: '/logs', text: 'Logs' }]);
      });

      it('fetches from /menu.json', async () => {
        await MenuClient.fetchEntries();
        expect(globalThis.fetch).toHaveBeenCalledWith('/menu.json');
      });
    });

    describe('when the request succeeds without entries key', () => {
      mockFetchSuccess({});

      it('returns an empty array', async () => {
        const result = await MenuClient.fetchEntries();
        expect(result).toEqual([]);
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
