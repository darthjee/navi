import axios from 'axios';
import { Client } from '../../../lib/services/Client.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';

describe('Client', () => {
  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let client;
  let expectedError;
  let resourceRequest;

  beforeEach(() => {
    client = ClientFactory.build({ baseUrl });
    resourceRequest = ResourceRequestFactory.build({ url, status });
  });

  it('returns true when status matches and requests using baseUrl + url', async () => {
    const response = AxiosUtils.stubGet(200);
    spyOn(Logger, 'info').and.stub();

    await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
    expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text', headers: {} });
    expect(Logger.info).toHaveBeenCalledWith(jasmine.stringContaining(fullUrl));
  });

  describe('when request status is not a match', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 404,
        url: fullUrl,
      });

      spyOn(Logger, 'error').and.stub();
      spyOn(Logger, 'info').and.stub();
    });

    it('throws RequestFailed when status does not match and logs the error', async () => {
      AxiosUtils.stubGet(404);

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('when request status is 404 but it is a match', () => {
    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url, status: 404 });
    });

    it('throws RequestFailed when status does not match', async () => {
      const response = AxiosUtils.stubGet(404);
      spyOn(Logger, 'info').and.stub();

      await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
    });
  });

  describe('when request is 5xx', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 500,
        url: fullUrl,
      });

      spyOn(Logger, 'error').and.stub();
      spyOn(Logger, 'info').and.stub();
    });

    it('throws RequestFailed with correct status and full url on error.response and logs the error', async () => {
      AxiosUtils.stubGetRejection({ response: { status: 500 } });

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('when a timeout is configured', () => {
    beforeEach(() => {
      client = ClientFactory.build({ baseUrl, timeout: 5000 });
      spyOn(Logger, 'info').and.stub();
    });

    it('passes the timeout to the axios request', async () => {
      const response = AxiosUtils.stubGet(200);

      await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text', headers: {} });
    });
  });

  describe('when headers are configured', () => {
    const headers = { Authorization: 'Bearer token123', 'X-Custom': 'value' };

    beforeEach(() => {
      client = ClientFactory.build({ baseUrl, headers });
      spyOn(Logger, 'info').and.stub();
    });

    it('passes the headers to the axios request', async () => {
      const response = AxiosUtils.stubGet(200);

      await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(fullUrl, {
        timeout: 5000,
        responseType: 'text',
        headers: { Authorization: 'Bearer token123', 'X-Custom': 'value' },
      });
    });
  });

  describe('when the url has parameters', () => {
    const paramUrl = '/categories/{:id}.json';
    const resolvedFullUrl = 'http://example.com/categories/42.json';

    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url: paramUrl, status });
      spyOn(Logger, 'info').and.stub();
    });

    it('resolves placeholders and requests the resolved URL', async () => {
      const response = AxiosUtils.stubGet(200);

      await expectAsync(client.perform(resourceRequest, { id: 42 })).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(resolvedFullUrl, { timeout: 5000, responseType: 'text', headers: {} });
      expect(Logger.info).toHaveBeenCalledWith(jasmine.stringContaining(resolvedFullUrl));
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

    describe('when header values reference environment variables', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'secret-token-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('resolves env var references via EnvResolver', () => {
        const config = {
          base_url: 'https://example.com',
          headers: { 'X-Token': '$NAVI_TEST_TOKEN' },
        };

        const result = Client.fromObject('api', config);

        expect(result.headers).toEqual({ 'X-Token': 'secret-token-value' });
      });
    });
  });
});
