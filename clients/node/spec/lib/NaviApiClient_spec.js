import axios from 'axios';
import { Logger } from '../../lib/logging/Logger.js';
import { NaviApiClient } from '../../lib/NaviApiClient.js';

describe('NaviApiClient', () => {
  const baseUrl = 'http://example.com';
  const token = 'secret-token';
  const path = '/api/config';
  const fullUrl = 'http://example.com/api/config';

  let apiClient;

  beforeEach(() => {
    apiClient = new NaviApiClient({ baseUrl, token });
  });

  describe('#post', () => {
    it('performs an authenticated POST request and returns the response data', async () => {
      const data = { status: 'accepted' };
      spyOn(axios, 'post').and.returnValue(Promise.resolve({ status: 200, data }));

      const result = await apiClient.post(path, { namespace: 'reports' });

      expect(result).toEqual(data);
      expect(axios.post).toHaveBeenCalledWith(fullUrl, { namespace: 'reports' }, {
        timeout: 5000,
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: jasmine.any(Function),
      });
    });

    it('defaults the body to {} when none is given', async () => {
      spyOn(axios, 'post').and.returnValue(Promise.resolve({ status: 200, data: {} }));

      await apiClient.post(path);

      expect(axios.post).toHaveBeenCalledWith(fullUrl, {}, jasmine.any(Object));
    });

    it('uses the configured timeout', async () => {
      apiClient = new NaviApiClient({ baseUrl, token, timeout: 1234 });
      spyOn(axios, 'post').and.returnValue(Promise.resolve({ status: 200, data: {} }));

      await apiClient.post(path);

      expect(axios.post).toHaveBeenCalledWith(fullUrl, {}, jasmine.objectContaining({ timeout: 1234 }));
    });

    describe('when the response status is >= 400', () => {
      it('throws ApiRequestFailed with the status, url and body', async () => {
        const data = { error: 'bad namespace' };
        spyOn(axios, 'post').and.returnValue(Promise.resolve({ status: 400, data }));

        await expectAsync(apiClient.post(path, {})).toBeRejectedWith(jasmine.objectContaining({
          name: 'ApiRequestFailed',
          statusCode: 400,
          url: fullUrl,
          body: data,
        }));
      });
    });

    describe('when the request itself fails', () => {
      it('throws ApiRequestFailed wrapping the original error', async () => {
        spyOn(axios, 'post').and.returnValue(Promise.reject(new Error('network down')));

        await expectAsync(apiClient.post(path, {})).toBeRejectedWith(jasmine.objectContaining({
          name: 'ApiRequestFailed',
          url: fullUrl,
        }));
      });
    });

    describe('debug logging of the outbound request', () => {
      beforeEach(() => {
        spyOn(Logger, 'debug');
        spyOn(axios, 'post').and.returnValue(Promise.resolve({ status: 200, data: {} }));
      });

      it('logs method, url and body before sending the request', async () => {
        const body = { namespace: 'reports' };

        await apiClient.post(path, body);

        expect(Logger.debug).toHaveBeenCalledWith('Outbound request', {
          method: 'POST',
          url: fullUrl,
          body,
        });
      });

      it('never logs headers or the Authorization/bearer token', async () => {
        await apiClient.post(path, { namespace: 'reports' });

        const [, loggedAttributes] = Logger.debug.calls.mostRecent().args;

        expect(loggedAttributes).toEqual({ method: 'POST', url: fullUrl, body: { namespace: 'reports' } });
        expect(loggedAttributes.headers).toBeUndefined();
        expect(JSON.stringify(loggedAttributes)).not.toContain(token);
        expect(JSON.stringify(loggedAttributes)).not.toContain('Authorization');
      });

      it('logs before issuing the request, not derived from the axios request/config object', async () => {
        await apiClient.post(path, { namespace: 'reports' });

        expect(Logger.debug).toHaveBeenCalledBefore(axios.post);
      });
    });
  });
});
