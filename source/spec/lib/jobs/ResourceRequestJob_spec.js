import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/RequestFailed.js';
import { ResponseWrapper } from '../../../lib/models/ResponseWrapper.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { ResourceRequestJobFactory } from '../../support/factories/ResourceRequestJobFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('ResourceRequestJob', () => {
  let resourceRequest;
  let clients;
  let client;
  let parameters;
  let job;
  let logContext;

  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let response;
  let expectedError;

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
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

  describe('#arguments', () => {
    it('returns resolved url', () => {
      expect(job.arguments).toEqual({ url });
    });

    describe('when job has a parameterized URL', () => {
      const paramUrl = '/categories/{:id}.json';
      const resolvedUrl = '/categories/7.json';

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url: paramUrl, status });
        parameters = { id: 7 };
        job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });
      });

      it('returns the resolved url with parameters substituted', () => {
        expect(job.arguments).toEqual({ url: resolvedUrl });
      });
    });
  });

  describe('#perform', () => {
    beforeEach(() => {
      spyOn(resourceRequest, 'enqueueActions').and.stub();
    });

    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = AxiosUtils.stubGet(200, '[]');
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, {
          timeout: 5000,
          responseType: 'text',
          headers: {},
          maxRedirects: 0,
          validateStatus: jasmine.any(Function),
        });
      });

      it('calls enqueueActions with a ResponseWrapper', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
        const wrapper = resourceRequest.enqueueActions.calls.argsFor(0)[0];
        expect(wrapper).toBeInstanceOf(ResponseWrapper);
      });

      it('passes the job parameters to the ResponseWrapper', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        const wrapper = resourceRequest.enqueueActions.calls.argsFor(0)[0];
        expect(wrapper.parameters).toBe(parameters);
      });

      it('logs debug when performing', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(logContext.debug).toHaveBeenCalled();
      });

      it('does not exhaust after several successful attempts', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
      });
    });

    describe('when the client request fails', () => {
      beforeEach(() => {
        response = AxiosUtils.stubGet(502, '[]');
        expectedError = new RequestFailed(502, fullUrl);
      });

      it('does not call enqueueActions', async () => {
        await job.perform(logContext).catch(() => {});
        expect(resourceRequest.enqueueActions).not.toHaveBeenCalled();
      });

      it('registers failure and increments attempts', async () => {
        expect(job.lastError).toBeUndefined();
        await job.perform(logContext).catch(() => {});
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeTrue();
        expect(job.lastError).toEqual(expectedError);
      });

      it('logs the error', async () => {
        await job.perform(logContext).catch(() => {});
        expect(logContext.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
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
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(resolvedFullUrl, {
          timeout: 5000,
          responseType: 'text',
          headers: {},
          maxRedirects: 0,
          validateStatus: jasmine.any(Function),
        });
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
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(unresolvedFullUrl, {
          timeout: 5000,
          responseType: 'text',
          headers: {},
          maxRedirects: 0,
          validateStatus: jasmine.any(Function),
        });
      });
    });

    describe('when the resource request has assets (assets only)', () => {
      const rawHtml = '<html><head><link rel="stylesheet" href="/a.css"></head></html>';

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url, status });
        spyOn(resourceRequest, 'hasAssets').and.returnValue(true);
        spyOn(resourceRequest, 'enqueueAssets').and.stub();
        spyOn(resourceRequest, 'enqueueActions').and.stub();
        parameters = {};
        job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });
        response = AxiosUtils.stubGet(200, rawHtml);
      });

      it('calls enqueueAssets with the raw response body', async () => {
        await job.perform(logContext);
        expect(resourceRequest.enqueueAssets).toHaveBeenCalledOnceWith(
          rawHtml,
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('does not call ResponseParser (enqueueActions still called but no-op without actions)', async () => {
        await job.perform(logContext);
        expect(resourceRequest.enqueueAssets).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the resource request has both assets and actions', () => {
      const rawHtml = '<html><head><link rel="stylesheet" href="/a.css"></head></html>';

      beforeEach(() => {
        resourceRequest = ResourceRequestFactory.build({ url, status });
        spyOn(resourceRequest, 'hasAssets').and.returnValue(true);
        spyOn(resourceRequest, 'enqueueAssets').and.stub();
        spyOn(resourceRequest, 'enqueueActions').and.stub();
        parameters = {};
        job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });
        response = AxiosUtils.stubGet(200, rawHtml);
      });

      it('calls both enqueueAssets and enqueueActions', async () => {
        await job.perform(logContext);
        expect(resourceRequest.enqueueAssets).toHaveBeenCalledTimes(1);
        expect(resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
      });
    });
  });
});
