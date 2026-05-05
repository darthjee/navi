import { handleResponse } from '../../src/clients/responseHandler.js';

describe('handleResponse', () => {
  describe('when the response is ok', () => {
    const data = [{ id: 1, name: 'Electronics' }];
    const headers = new Headers({ PAGE: '2', 'PAGE-SIZE': '5', PAGES: '4' });
    let result;

    beforeEach(async () => {
      const res = { ok: true, headers, json: () => Promise.resolve(data) };
      result = await handleResponse(res);
    });

    it('returns the data', () => {
      expect(result.data).toEqual(data);
    });

    it('returns pagination metadata', () => {
      expect(result.pagination).toEqual({ page: 2, pageSize: 5, pages: 4 });
    });
  });

  describe('when the response is not ok', () => {
    it('throws an error with the status code', async () => {
      const res = { ok: false, status: 422 };
      await expectAsync(handleResponse(res)).toBeRejectedWithError('HTTP 422');
    });
  });
});
