import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/request/RequestFailed.js';
import { ResponseWrapper } from '../../../lib/models/response/ResponseWrapper.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { ResourceRequestJobFactory } from '../../support/factories/ResourceRequestJobFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

const baseUrl = 'http://example.com';
const url = '/categories.json';
const fullUrl = 'http://example.com/categories.json';
const status = 200;

const expectedRequestOptions = {
  timeout: 5000,
  responseType: 'text',
  headers: {},
  maxRedirects: 0,
  validateStatus: jasmine.any(Function),
};

describe('ResourceRequestJob', () => {
  let resourceRequest;
  let clients;
  let client;
  let parameters;
  let job;
  let logContext;
  let response;

  const rebuildJob = ({ requestUrl = url, jobParameters = {} } = {}) => {
    resourceRequest = ResourceRequestFactory.build({ url: requestUrl, status });
    parameters = jobParameters;
    job = ResourceRequestJobFactory.build({ resourceRequest, clients, parameters });
  };

  const stubEnqueueMethods = () => {
    spyOn(resourceRequest, 'enqueueActions').and.stub();
    spyOn(resourceRequest, 'enqueuePaginatedActions').and.stub();
  };

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    client = ClientFactory.build({ baseUrl });
    clients = ClientRegistryFactory.build({ default: client });

    rebuildJob();
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('id');
    });
  });

  describe('#arguments', () => {
    [
      {
        description: 'for a plain URL',
        requestUrl: url,
        jobParameters: {},
        expectedArguments: { url },
      },
      {
        description: 'for a parameterized URL',
        requestUrl: '/categories/{:id}.json',
        jobParameters: { id: 7 },
        expectedArguments: { url: '/categories/7.json' },
      },
    ].forEach(({ description, requestUrl, jobParameters, expectedArguments }) => {
      it(`returns the resolved URL ${description}`, () => {
        rebuildJob({ requestUrl, jobParameters });

        expect(job.arguments).toEqual(expectedArguments);
      });
    });
  });

  describe('#perform', () => {
    beforeEach(() => {
      stubEnqueueMethods();
    });

    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = AxiosUtils.stubGet(200, '[]');
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, expectedRequestOptions);
      });

      it('calls enqueueActions with a ResponseWrapper', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
        expect(resourceRequest.enqueueActions.calls.argsFor(0)[0]).toBeInstanceOf(ResponseWrapper);
      });

      it('calls enqueuePaginatedActions with a ResponseWrapper', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(resourceRequest.enqueuePaginatedActions).toHaveBeenCalledTimes(1);
        expect(resourceRequest.enqueuePaginatedActions.calls.argsFor(0)[0]).toBeInstanceOf(ResponseWrapper);
      });

      it('passes the job parameters to enqueueActions', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(resourceRequest.enqueueActions.calls.argsFor(0)[0].parameters).toBe(parameters);
      });

      it('passes the resolved URL as originUrl to both enqueue methods', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(resourceRequest.enqueueActions.calls.argsFor(0)[1]).toBe(url);
        expect(resourceRequest.enqueuePaginatedActions.calls.argsFor(0)[2]).toBe(url);
      });

      it('passes the job parameters to enqueuePaginatedActions', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(resourceRequest.enqueuePaginatedActions.calls.argsFor(0)[1]).toBe(parameters);
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
      const expectedError = new RequestFailed(502, fullUrl);

      beforeEach(() => {
        response = AxiosUtils.stubGet(502, '[]');
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

    [
      {
        description: 'when the resource request has a parameterized URL',
        requestUrl: '/categories/{:id}.json',
        jobParameters: { id: 7 },
        expectedUrl: 'http://example.com/categories/7.json',
      },
      {
        description: 'when parameters are empty and the URL has placeholders',
        requestUrl: '/categories/{:id}.json',
        jobParameters: {},
        expectedUrl: 'http://example.com/categories/{:id}.json',
      },
    ].forEach(({ description, requestUrl, jobParameters, expectedUrl }) => {
      it(`requests the expected URL ${description}`, async () => {
        rebuildJob({ requestUrl, jobParameters });
        stubEnqueueMethods();
        response = AxiosUtils.stubGet(200, '[]');

        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(axios.get).toHaveBeenCalledWith(expectedUrl, expectedRequestOptions);
      });
    });

    describe('when the resource request has assets', () => {
      const rawHtml = '<html><head><link rel="stylesheet" href="/a.css"></head></html>';

      beforeEach(() => {
        rebuildJob();
        spyOn(resourceRequest, 'hasAssets').and.returnValue(true);
        spyOn(resourceRequest, 'enqueueAssets').and.stub();
        spyOn(resourceRequest, 'enqueueActions').and.stub();
        spyOn(resourceRequest, 'enqueuePaginatedActions').and.stub();
        response = AxiosUtils.stubGet(200, rawHtml);
      });

      it('calls enqueueAssets with the raw response body and originUrl', async () => {
        await job.perform(logContext);

        expect(resourceRequest.enqueueAssets).toHaveBeenCalledOnceWith(
          rawHtml,
          jasmine.anything(),
          jasmine.anything(),
          url,
        );
      });

      it('still calls enqueueActions after enqueueing assets', async () => {
        await job.perform(logContext);

        expect(resourceRequest.enqueueAssets).toHaveBeenCalledTimes(1);
        expect(resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
      });
    });
  });
});
