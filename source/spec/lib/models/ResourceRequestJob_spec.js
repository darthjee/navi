import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/RequestFailed.js';
import { ResponseWrapper } from '../../../lib/models/ResponseWrapper.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { ResourceRequestJobFactory } from '../../support/factories/ResourceRequestJobFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';

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
    LoggerUtils.stubLoggerMethods();
    resourceRequest = ResourceRequestFactory.build({ url, status });
    client = ClientFactory.build({ baseUrl });
    clients = ClientRegistryFactory.build({ default: client });
    parameters = {};

    job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('id');
    });
  });

  describe('#perform', () => {
    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = AxiosUtils.stubGet(200, '[]');
        spyOn(resourceRequest, 'enqueueActions').and.stub();
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text', headers: {} });
      });

      it('calls enqueueActions with a ResponseWrapper', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
        const wrapper = resourceRequest.enqueueActions.calls.argsFor(0)[0];
        expect(wrapper).toBeInstanceOf(ResponseWrapper);
      });

      it('passes the job parameters to the ResponseWrapper', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        const wrapper = resourceRequest.enqueueActions.calls.argsFor(0)[0];
        expect(wrapper.parameters).toBe(parameters);
      });

      it('logs info when performing', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(Logger.info).toHaveBeenCalled();
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
        response = AxiosUtils.stubGet(502, '[]');
        expectedError = new RequestFailed(502, fullUrl);
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
        expect(Logger.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
      });
    });
    describe('when the resource request has a parameterized URL', () => {
      const paramUrl = '/categories/{:id}.json';
      const resolvedFullUrl = 'http://example.com/categories/7.json';

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: paramUrl, status });
        parameters = { id: 7 };
        job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });

        response = AxiosUtils.stubGet(200, '[]');
        spyOn(resourceRequest, 'enqueueActions').and.stub();
      });

      it('resolves placeholders and requests the resolved URL', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(resolvedFullUrl, { timeout: 5000, responseType: 'text', headers: {} });
      });
    });

    describe('when parameters are empty and URL has placeholders', () => {
      const paramUrl = '/categories/{:id}.json';
      const unresolvedFullUrl = 'http://example.com/categories/{:id}.json';

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: paramUrl, status });
        parameters = {};
        job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });

        response = AxiosUtils.stubGet(200, '[]');
        spyOn(resourceRequest, 'enqueueActions').and.stub();
      });

      it('leaves placeholders unchanged in the URL', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(unresolvedFullUrl, { timeout: 5000, responseType: 'text', headers: {} });
      });
    });
  });
});
