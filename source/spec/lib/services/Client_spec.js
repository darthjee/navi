import axios from 'axios';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

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
    const response = { status: 200 };
    const promise = Promise.resolve(response);
    spyOn(axios, 'get').and.returnValue(promise);
    spyOn(Logger, 'info').and.stub();

    await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
    expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text' });
    expect(Logger.info).toHaveBeenCalledWith(`[Client:default] Requesting ${fullUrl}`);
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
      const promise = Promise.resolve({ status: 404 });
      spyOn(axios, 'get').and.returnValue(promise);

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('when request status is 404 but it is a match', () => {
    beforeEach(() => {
      resourceRequest = ResourceRequestFactory.build({ url, status: 404 });
    });

    it('throws RequestFailed when status does not match', async () => {
      const response = { status: 404 };
      const promise = Promise.resolve(response);
      spyOn(axios, 'get').and.returnValue(promise);
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
      const promise = Promise.reject({ response: { status: 500 } });
      spyOn(axios, 'get').and.returnValue(promise);

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
      const response = { status: 200 };
      spyOn(axios, 'get').and.returnValue(Promise.resolve(response));

      await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
      expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text' });
    });
  });
});
