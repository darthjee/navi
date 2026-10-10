import axios from 'axios';
import { Logger } from 'deku-sprout';
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

      const expectMessage = async (data, message) => {
        spyOn(axios, 'post').and.returnValue(Promise.resolve({ status: 400, data }));

        await expectAsync(apiClient.post(path, {})).toBeRejectedWith(jasmine.objectContaining({
          name: 'ApiRequestFailed',
          message,
        }));
      };

      const baseMessage = `Request to ${fullUrl} failed with status 400`;

      it('appends body.error when it is a string', async () => {
        await expectMessage(
          { error: 'Resource "x" not found.' },
          `${baseMessage}: Resource "x" not found.`,
        );
      });

      it('does not truncate a long body.error', async () => {
        const error = 'e'.repeat(300);

        await expectMessage({ error }, `${baseMessage}: ${error}`);
      });

      it('appends the JSON-serialized body when there is no string error', async () => {
        await expectMessage({ foo: 'bar' }, `${baseMessage}: {"foo":"bar"}`);
      });

      it('appends the JSON-serialized body when error is not a string', async () => {
        await expectMessage({ error: { code: 1 } }, `${baseMessage}: {"error":{"code":1}}`);
      });

      it('appends the JSON-serialized body for arrays', async () => {
        await expectMessage(['a', 'b'], `${baseMessage}: ["a","b"]`);
      });

      it('appends a short string body as-is', async () => {
        await expectMessage('Bad Gateway', `${baseMessage}: Bad Gateway`);
      });

      it('truncates a long string body to 200 characters followed by an ellipsis', async () => {
        const html = `<html>${'x'.repeat(300)}</html>`;

        await expectMessage(html, `${baseMessage}: ${html.slice(0, 200)}…`);
      });

      it('truncates a long JSON-serialized body to 200 characters followed by an ellipsis', async () => {
        const data = { foo: 'y'.repeat(300) };

        await expectMessage(data, `${baseMessage}: ${JSON.stringify(data).slice(0, 200)}…`);
      });

      it('does not truncate a string body of exactly 200 characters', async () => {
        const text = 'z'.repeat(200);

        await expectMessage(text, `${baseMessage}: ${text}`);
      });

      [
        ['undefined', undefined],
        ['null', null],
        ['an empty string', ''],
        ['an empty object', {}],
        ['an empty array', []],
      ].forEach(([description, data]) => {
        it(`appends nothing when the body is ${description}`, async () => {
          await expectMessage(data, baseMessage);
        });
      });
    });

    describe('when the request itself fails', () => {
      it('throws ApiRequestFailed wrapping the original error', async () => {
        spyOn(axios, 'post').and.returnValue(Promise.reject(new Error('network down')));

        await expectAsync(apiClient.post(path, {})).toBeRejectedWith(jasmine.objectContaining({
          name: 'ApiRequestFailed',
          url: fullUrl,
          message: `Request to ${fullUrl} failed: network down`,
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
