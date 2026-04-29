import fetchBaseUrls from '../../src/clients/BaseUrlsClient.js';

describe('BaseUrlsClient', () => {
  describe('fetchBaseUrls', () => {
    describe('when the request succeeds', () => {
      describe('with a list of base URLs', () => {
        const data = { base_urls: ['https://example.com', 'https://other.com'] };

        beforeEach(() => {
          spyOn(globalThis, 'fetch').and.returnValue(
            Promise.resolve({ ok: true, json: () => Promise.resolve(data) }),
          );
        });

        it('returns the array of base URLs', async () => {
          const result = await fetchBaseUrls();
          expect(result).toEqual(['https://example.com', 'https://other.com']);
        });

        it('fetches from /clients/base_urls.json', async () => {
          await fetchBaseUrls();
          expect(globalThis.fetch).toHaveBeenCalledWith('/clients/base_urls.json');
        });
      });

      describe('with an empty list', () => {
        beforeEach(() => {
          spyOn(globalThis, 'fetch').and.returnValue(
            Promise.resolve({ ok: true, json: () => Promise.resolve({ base_urls: [] }) }),
          );
        });

        it('returns an empty array', async () => {
          const result = await fetchBaseUrls();
          expect(result).toEqual([]);
        });
      });

      describe('with missing base_urls key', () => {
        beforeEach(() => {
          spyOn(globalThis, 'fetch').and.returnValue(
            Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
          );
        });

        it('returns an empty array', async () => {
          const result = await fetchBaseUrls();
          expect(result).toEqual([]);
        });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 503 }),
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(fetchBaseUrls()).toBeRejectedWithError('HTTP 503');
      });
    });
  });
});
