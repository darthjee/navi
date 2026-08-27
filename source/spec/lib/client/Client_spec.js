import axios from 'axios';
import { Client } from '../../../lib/client/Client.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('Client', () => {
  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let client;
  let expectedError;
  let resourceRequest;
  let logContext;

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    client = ClientFactory.build({ baseUrl });
    resourceRequest = ResourceRequestFactory.build({ url, status });
  });

  it('returns true when status matches and requests using baseUrl + url', async () => {
    const response = AxiosUtils.stubGet(200);

    await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeResolvedTo(response);
    expect(axios.get).toHaveBeenCalledWith(fullUrl, {
      timeout: 5000,
      responseType: 'text',
      headers: {},
      maxRedirects: 0,
      validateStatus: jasmine.any(Function),
    });
    expect(logContext.info).toHaveBeenCalledWith(jasmine.stringContaining(fullUrl));
    expect(logContext.info).toHaveBeenCalledWith(jasmine.stringContaining(`Response ${fullUrl} → 200`));
    expect(logContext.info).toHaveBeenCalledWith(jasmine.stringContaining(`${fullUrl} matched (expected 200)`));
  });

  describe('when request status is not a match', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 404,
        url: fullUrl,
      });

    });

    it('throws RequestFailed when status does not match and logs the error', async () => {
      AxiosUtils.stubGet(404);

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeRejectedWith(expectedError);
      expect(logContext.info).toHaveBeenCalledWith(jasmine.stringContaining(`Response ${fullUrl} → 404`));
      expect(logContext.info).toHaveBeenCalledWith(jasmine.stringContaining(`${fullUrl} did not match (got 404, expected 200)`));
      expect(logContext.error).toHaveBeenCalled();
    });
  });

  describe('when request status is 404 but it is a match', () => {
    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url, status: 404 });
    });

    it('throws RequestFailed when status does not match', async () => {
      const response = AxiosUtils.stubGet(404);

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeResolvedTo(response);
    });
  });

  describe('when request is 5xx', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 500,
        url: fullUrl,
      });

    });

    it('throws RequestFailed with correct status and full url on error.response and logs the error', async () => {
      AxiosUtils.stubGetRejection({ response: { status: 500 } });

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeRejectedWith(expectedError);
      expect(logContext.error).toHaveBeenCalled();
    });
  });

  describe('when a timeout is configured', () => {
    beforeEach(() => {
      client = ClientFactory.build({ baseUrl, timeout: 5000 });
    });

    it('passes the timeout to the axios request', async () => {
      const response = AxiosUtils.stubGet(200);

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(fullUrl, {
        timeout: 5000,
        responseType: 'text',
        headers: {},
        maxRedirects: 0,
        validateStatus: jasmine.any(Function),
      });
    });
  });

  describe('when headers are configured', () => {
    const headers = { Authorization: 'Bearer token123', 'X-Custom': 'value' };

    beforeEach(() => {
      client = ClientFactory.build({ baseUrl, headers });
    });

    it('passes the headers to the axios request', async () => {
      const response = AxiosUtils.stubGet(200);

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(fullUrl, {
        timeout: 5000,
        responseType: 'text',
        headers: { Authorization: 'Bearer token123', 'X-Custom': 'value' },
        maxRedirects: 0,
        validateStatus: jasmine.any(Function),
      });
    });
  });

  describe('when the url has parameters', () => {
    const paramUrl = '/categories/{:id}.json';
    const resolvedFullUrl = 'http://example.com/categories/42.json';

    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url: paramUrl, status });
    });

    it('resolves placeholders and requests the resolved URL', async () => {
      const response = AxiosUtils.stubGet(200);

      await expectAsync(client.perform(resourceRequest, { id: 42 }, logContext)).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(resolvedFullUrl, {
        timeout: 5000,
        responseType: 'text',
        headers: {},
        maxRedirects: 0,
        validateStatus: jasmine.any(Function),
      });
      expect(logContext.info).toHaveBeenCalledWith(jasmine.stringContaining(resolvedFullUrl));
    });
  });

  describe('when request is a redirect (3xx) and it is the expected status', () => {
    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url, status: 301 });
    });

    it('resolves with the redirect response without following it', async () => {
      const response = AxiosUtils.stubGet(301);

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeResolvedTo(response);
    });
  });

  describe('when request is a redirect (3xx) but expected status is 200', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 301,
        url: fullUrl,
      });
    });

    it('throws RequestFailed with the redirect status and logs the error', async () => {
      AxiosUtils.stubGet(301);

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeRejectedWith(expectedError);
      expect(logContext.error).toHaveBeenCalled();
    });
  });

  describe('#emit', () => {
    const resourceUrl = '/items';
    const fullEmitUrl = 'http://example.com/items';
    const body = { name: 'item' };

    const axiosMethodByVerb = { POST: 'post', PUT: 'put', PATCH: 'patch' };
    const stubByVerb = { POST: 'stubPost', PUT: 'stubPut', PATCH: 'stubPatch' };

    ['POST', 'PUT', 'PATCH'].forEach((method) => {
      describe(`when method is ${method}`, () => {
        it('sends the body as the JSON payload, reusing baseUrl/headers/timeout', async () => {
          const response = AxiosUtils[stubByVerb[method]](200);

          await expectAsync(client.emit(method, resourceUrl, body, 200, logContext)).toBeResolvedTo(response);
          expect(axios[axiosMethodByVerb[method]]).toHaveBeenCalledWith(fullEmitUrl, body, {
            timeout: 5000,
            headers: {},
            validateStatus: jasmine.any(Function),
          });
        });
      });
    });

    describe('when no expectedStatus is given', () => {
      [200, 201, 204].forEach((statusCode) => {
        it(`treats ${statusCode} as a success`, async () => {
          const response = AxiosUtils.stubPost(statusCode);

          await expectAsync(client.emit('POST', resourceUrl, body, undefined, logContext)).toBeResolvedTo(response);
        });
      });

      it('throws RequestFailed for a non-2xx response', async () => {
        AxiosUtils.stubPost(404);

        await expectAsync(client.emit('POST', resourceUrl, body, undefined, logContext)).toBeRejectedWith(
          jasmine.objectContaining({ name: 'RequestFailed', statusCode: 404, url: fullEmitUrl }),
        );
      });
    });

    describe('when an explicit expectedStatus is given', () => {
      it('succeeds only on an exact match', async () => {
        const response = AxiosUtils.stubPost(201);

        await expectAsync(client.emit('POST', resourceUrl, body, 201, logContext)).toBeResolvedTo(response);
      });

      it('throws RequestFailed for a different status, even a different 2xx one', async () => {
        AxiosUtils.stubPost(200);

        await expectAsync(client.emit('POST', resourceUrl, body, 201, logContext)).toBeRejectedWith(
          jasmine.objectContaining({ name: 'RequestFailed', statusCode: 200, url: fullEmitUrl }),
        );
      });
    });

    describe('when the request fails with a network error', () => {
      it('propagates the error and logs it', async () => {
        const error = new Error('network down');
        AxiosUtils.stubPostRejection(error);

        await expectAsync(client.emit('POST', resourceUrl, body, 200, logContext)).toBeRejectedWith(error);
        expect(logContext.error).toHaveBeenCalled();
      });
    });
  });

  describe('.fromObject', () => {
    describe('when headers are provided', () => {
      it('creates a client with the configured headers', () => {
        const config = {
          base_url: 'https://api.example.com',
          headers: { 'X-Api-Key': 'abc123' },
        };

        const result = Client.fromObject('api', config);

        expect(result.headers).toEqual({ 'X-Api-Key': 'abc123' });
      });
    });

    describe('when headers are not provided', () => {
      it('creates a client with empty headers', () => {
        const config = { base_url: 'https://example.com' };

        const result = Client.fromObject('default', config);

        expect(result.headers).toEqual({});
      });
    });

    describe('when linkText is provided', () => {
      it('creates a client with the configured link text', () => {
        const config = {
          base_url: 'https://example.com',
          linkText: 'Default Domain',
        };

        const result = Client.fromObject('default', config);

        expect(result.linkText).toEqual('Default Domain');
      });
    });

    describe('when linkText is not provided', () => {
      it('creates a client with null link text', () => {
        const config = { base_url: 'https://example.com' };

        const result = Client.fromObject('default', config);

        expect(result.linkText).toBeNull();
      });
    });

    describe('namespace', () => {
      it('defaults to "default" when not given', () => {
        const result = Client.fromObject('default', { base_url: 'https://example.com' });

        expect(result.namespace).toBe('default');
      });

      it('uses the given namespace', () => {
        const result = Client.fromObject('default', { base_url: 'https://example.com' }, { namespace: 'clients' });

        expect(result.namespace).toBe('clients');
      });
    });
  });

  describe('.fromListObject', () => {
    it('propagates the given namespace to every built Client', () => {
      const clients = Client.fromListObject(
        { default: { base_url: 'https://example.com' }, other: { base_url: 'https://other.com' } },
        { namespace: 'clients' },
      );

      expect(clients.every((c) => c.namespace === 'clients')).toBeTrue();
    });

    it('defaults the namespace to "default"', () => {
      const clients = Client.fromListObject({ default: { base_url: 'https://example.com' } });

      expect(clients[0].namespace).toBe('default');
    });
  });
});
