import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/RequestFailed.js';
import { ResourceRequestJob } from '../../../lib/models/ResourceRequestJob.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceRequestJob', () => {
  let resourceRequest;
  let clients;
  let client;
  let parameters;
  let job;

  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let response;
  let expectedError;

  beforeEach(() => {
    resourceRequest = ResourceRequestFactory.build({ url, status });
    client = ClientFactory.build({ baseUrl });
    clients = ClientRegistryFactory.build({ default: client });
    parameters = {};

    job = new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('id');
    });
  });

  describe('#perform', () => {
    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = { status: 200, data: '[]' };
        spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
        spyOn(Logger, 'info').and.stub();
        spyOn(resourceRequest, 'enqueueActions').and.stub();
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text' });
      });

      it('calls enqueueActions with the response data', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(resourceRequest.enqueueActions).toHaveBeenCalledOnceWith(response.data);
      });

      it('logs info when performing', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(Logger.info).toHaveBeenCalledWith(`Job #${job.id} performing`);
      });

      it('does not exhaust after several successful attempts', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
      });
    });

    describe('when the client request fails', () => {
      beforeEach(() => {
        response = { status: 502, data: '[]' };
        expectedError = new RequestFailed(502, fullUrl);
        spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
        spyOn(Logger, 'error').and.stub();
        spyOn(Logger, 'info').and.stub();
        spyOn(resourceRequest, 'enqueueActions').and.stub();
      });

      it('does not call enqueueActions', async () => {
        await job.perform().catch(() => {});
        expect(resourceRequest.enqueueActions).not.toHaveBeenCalled();
      });

      it('registers failure and increments attempts', async () => {
        expect(job.lastError).toBeUndefined();
        await job.perform().catch(() => {});
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeTrue();
        expect(job.lastError).toEqual(expectedError);
      });

      it('logs the error', async () => {
        await job.perform().catch(() => {});
        expect(Logger.error).toHaveBeenCalledWith(`Job #${job.id} failed: ${expectedError}`);
      });
    });
  });
});
