import axios from 'axios';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Client } from '../../lib/services/Client.js';

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
    resourceRequest = new ResourceRequest({ url, status });
  });

  it('returns true when status matches and requests using baseUrl + url', async () => {
    spyOn(axios, 'get').and.returnValue(Promise.resolve({ status: 200 }));

    await expectAsync(client.perform(resourceRequest)).toBeResolvedTo(true);
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
      spyOn(axios, 'get').and.returnValue(Promise.resolve({ status: 404 }));

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
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
      spyOn(axios, 'get').and.returnValue(Promise.reject({ response: { status: 500 } }));

      await expectAsync(client.perform(resourceRequest)).toBeRejectedWith(expectedError);
    });
  });
});
