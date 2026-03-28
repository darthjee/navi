import axios from 'axios';
import { Client } from '../../lib/services/Client.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';

describe('Client', () => {
  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let client;
  let expectedError;
  let resourceRequest;

  beforeEach(() => {
    client = new Client({ name: 'default', baseUrl });
    resourceRequest = ResourceRequestFactory.build({ url, status });
  });

  it('returns true when status matches and requests using baseUrl + url', async () => {
    const response = { status: 200 };
    const promise = Promise.resolve(response);
    spyOn(axios, 'get').and.returnValue(promise);

    await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(response);
    expect(axios.get).toHaveBeenCalledWith(fullUrl);
  });

  describe('when request status is not a match', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 404,
        url: fullUrl,
      });
    });

    it('throws RequestFailed when status does not match', async () => {
      const promise = Promise.resolve({ status: 404 });
      spyOn(axios, 'get').and.returnValue(promise);

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
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
    });

    it('throws RequestFailed with correct status and full url on error.response', async () => {
      const promise = Promise.reject({ response: { status: 500 } });
      spyOn(axios, 'get').and.returnValue(promise);

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
    });
  });
});
