const { ResourceRequest } = require('../lib/models/ResourceRequest');
const axios = require('axios');

describe('ResourceRequest', () => {
  const url = 'http://example.com';
  const status = 200;
  let resourceRequest;
  let expectedError;

  beforeEach(() => {
    resourceRequest = new ResourceRequest({ url, status });
  });

  it('returns true when status matches', async () => {
    spyOn(axios, 'get').and.returnValue(Promise.resolve({ status: 200 }));
    await expectAsync(resourceRequest.check()).toBeResolvedTo(true);
  });

  describe('when request status is not a match', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 404,
        url,
      });
    });
    
    it('throws RequestFailed when status does not match', async () => {
      spyOn(axios, 'get').and.returnValue(Promise.resolve({ status: 404 }));
      await expectAsync(resourceRequest.check()).toBeRejectedWith(expectedError);
    });
  });

  describe('when request is 5xx', () => {
    beforeEach(() => {
      expectedError = jasmine.objectContaining({
        name: 'RequestFailed',
        statusCode: 500,
        url,
      });
    });

    it('throws RequestFailed with correct status and url on error.response', async () => {
      spyOn(axios, 'get').and.returnValue(Promise.reject({ response: { status: 500 } }));
      await expectAsync(resourceRequest.check()).toBeRejectedWith(expectedError);
    });
  });
});
