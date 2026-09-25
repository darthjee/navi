import axios from 'axios';
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

    it('forwards the response headers onto the thrown RequestFailed', async () => {
      const headers = { 'retry-after': '5' };
      spyOn(axios, 'get').and.returnValue(Promise.resolve({ status: 404, headers }));

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeRejectedWith(
        jasmine.objectContaining({ name: 'RequestFailed', statusCode: 404, headers }),
      );
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

    it('forwards the caught error response headers onto the thrown RequestFailed', async () => {
      const headers = { 'retry-after': '30' };
      AxiosUtils.stubGetRejection({ response: { status: 500, headers } });

      await expectAsync(client.perform(resourceRequest, {}, logContext)).toBeRejectedWith(
        jasmine.objectContaining({ name: 'RequestFailed', statusCode: 500, headers }),
      );
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
});
