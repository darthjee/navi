import fetchLogs from '../../src/clients/LogsClient.js';

describe('LogsClient', () => {
  describe('fetchLogs', () => {
    describe('without lastId', () => {
      describe('when the request succeeds', () => {
        const logs = [
          { id: 1, level: 'info', message: 'Server started', timestamp: '2024-01-01T00:00:00Z' },
        ];

        beforeEach(() => {
          spyOn(globalThis, 'fetch').and.returnValue(
            Promise.resolve({ ok: true, json: () => Promise.resolve(logs) }),
          );
        });

        it('fetches from /logs.json', async () => {
          await fetchLogs();
          expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json');
        });

        it('returns the logs array', async () => {
          const result = await fetchLogs();
          expect(result).toEqual(logs);
        });
      });

      describe('when the request fails', () => {
        beforeEach(() => {
          spyOn(globalThis, 'fetch').and.returnValue(
            Promise.resolve({ ok: false, status: 500 }),
          );
        });

        it('throws an error with the HTTP status code', async () => {
          await expectAsync(fetchLogs()).toBeRejectedWithError('HTTP 500');
        });
      });
    });

    describe('with a numeric lastId', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        );
      });

      it('appends last_id to the query string', async () => {
        await fetchLogs({ lastId: 42 });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json?last_id=42');
      });
    });

    describe('with a lastId that contains special characters', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        );
      });

      it('URI-encodes the lastId value', async () => {
        await fetchLogs({ lastId: 'a b+c' });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json?last_id=a%20b%2Bc');
      });
    });

    describe('with lastId as null', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        );
      });

      it('fetches from /logs.json without a query parameter', async () => {
        await fetchLogs({ lastId: null });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json');
      });
    });

    describe('with lastId as undefined', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        );
      });

      it('fetches from /logs.json without a query parameter', async () => {
        await fetchLogs({ lastId: undefined });
        expect(globalThis.fetch).toHaveBeenCalledWith('/logs.json');
      });
    });
  });
});
