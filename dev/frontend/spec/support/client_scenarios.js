import { mockFetchFailure } from 'navi-spec-support/fetch.js';

// Table-driven scenarios for the client specs. Every function must be called
// at describe level, after the fetch stub was registered (mockFetchSuccess).

// One `it` per row: calls the client function and expects the request URL.
// Rows: `{ description, call, url }`.
const itRequests = (rows) => {
  rows.forEach(({ description, call, url }) => {
    it(description, async () => {
      await call();
      expect(globalThis.fetch).toHaveBeenCalledWith(url);
    });
  });
};

// One `it` per row: calls the client function and expects `select(result)` to
// equal `expected` (`select` defaults to the whole result).
// Rows: `{ description, call, select, expected }`.
const itResolvesWith = (rows) => {
  rows.forEach(({ description, call, select = (result) => result, expected }) => {
    it(description, async () => {
      expect(select(await call())).toEqual(expected);
    });
  });
};

// Registers a failing-request describe: the fetch answers with HTTP `status`
// and `call` is expected to reject with `HTTP <status>`.
const itRejectsWithStatus = ({ description, call, status }) => {
  describe(description, () => {
    mockFetchFailure(status);

    it('throws an error with the status code', async () => {
      await expectAsync(call()).toBeRejectedWithError(`HTTP ${status}`);
    });
  });
};

export { itRejectsWithStatus, itRequests, itResolvesWith };
