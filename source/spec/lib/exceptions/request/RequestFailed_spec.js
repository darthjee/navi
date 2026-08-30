import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { RequestFailed } from '../../../../lib/exceptions/request/RequestFailed.js';

describe('RequestFailed', () => {
  const url = 'http://example.com/items';

  describe('with default message and headers', () => {
    let error;

    beforeEach(() => {
      error = new RequestFailed(404, url);
    });

    it('has the correct name', () => {
      expect(error.name).toBe('RequestFailed');
    });

    it('has a message describing the failure', () => {
      expect(error.message).toBe(`Request failed: 404 for ${url}`);
    });

    it('exposes the statusCode', () => {
      expect(error.statusCode).toBe(404);
    });

    it('exposes the url', () => {
      expect(error.url).toBe(url);
    });

    it('defaults headers to an empty object', () => {
      expect(error.headers).toEqual({});
    });

    it('is an instance of AppError', () => {
      expect(error).toBeInstanceOf(AppError);
    });

    it('is an instance of Error', () => {
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('with a custom message', () => {
    it('prefixes the message with it', () => {
      const error = new RequestFailed(500, url, 'Emit failed');

      expect(error.message).toBe(`Emit failed: 500 for ${url}`);
    });
  });

  describe('with headers', () => {
    it('exposes the given headers', () => {
      const headers = { 'retry-after': '5' };
      const error = new RequestFailed(429, url, 'Request failed', headers);

      expect(error.headers).toEqual(headers);
    });
  });
});
