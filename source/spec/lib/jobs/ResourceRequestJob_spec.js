import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/request/RequestFailed.js';
import { ResponseWrapper } from '../../../lib/models/response/ResponseWrapper.js';
import { JobLifecycleExamples } from '../../support/utils/JobLifecycleExamples.js';
import { ResourceRequestJobSpecUtils } from '../../support/utils/ResourceRequestJobSpecUtils.js';

const { url, fullUrl } = ResourceRequestJobSpecUtils;

describe('ResourceRequestJob', () => {
  const ctx = ResourceRequestJobSpecUtils.setup();

  describe('#constructor', () => {
    JobLifecycleExamples.identityExamples({ getJob: () => ctx.job, expectedId: 'id', checkInstance: false });
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
        ctx.rebuildJob({ requestUrl, jobParameters });

        expect(ctx.job.arguments).toEqual(expectedArguments);
      });
    });
  });

  describe('#perform', () => {
    beforeEach(() => {
      ctx.stubEnqueueMethods();
    });

    describe('when the client request is successful', () => {
      beforeEach(() => {
        ctx.stubGet();
      });

      it('resolves with the response', async () => {
        await ctx.performAndExpectResponse();
        expect(axios.get).toHaveBeenCalledWith(fullUrl, ResourceRequestJobSpecUtils.expectedRequestOptions);
      });

      it('calls enqueueActions with a ResponseWrapper', async () => {
        await ctx.performAndExpectResponse();

        expect(ctx.resourceRequest.enqueueActions).toHaveBeenCalledTimes(1);
        expect(ctx.resourceRequest.enqueueActions.calls.argsFor(0)[0]).toBeInstanceOf(ResponseWrapper);
      });

      it('calls enqueuePaginatedActions with a ResponseWrapper', async () => {
        await ctx.performAndExpectResponse();

        expect(ctx.resourceRequest.enqueuePaginatedActions).toHaveBeenCalledTimes(1);
        expect(ctx.resourceRequest.enqueuePaginatedActions.calls.argsFor(0)[0]).toBeInstanceOf(ResponseWrapper);
      });

      it('passes the job parameters to enqueueActions', async () => {
        await ctx.performAndExpectResponse();

        expect(ctx.resourceRequest.enqueueActions.calls.argsFor(0)[0].parameters).toBe(ctx.parameters);
      });

      it('passes the resolved URL as originUrl to both enqueue methods', async () => {
        await ctx.performAndExpectResponse();

        expect(ctx.resourceRequest.enqueueActions.calls.argsFor(0)[1]).toBe(url);
        expect(ctx.resourceRequest.enqueuePaginatedActions.calls.argsFor(0)[2]).toBe(url);
      });

      it('passes the job parameters to enqueuePaginatedActions', async () => {
        await ctx.performAndExpectResponse();

        expect(ctx.resourceRequest.enqueuePaginatedActions.calls.argsFor(0)[1]).toBe(ctx.parameters);
      });

      it('logs debug when performing', async () => {
        await ctx.performAndExpectResponse();

        expect(ctx.logContext.debug).toHaveBeenCalled();
      });

      it('does not exhaust after several successful attempts', async () => {
        await ctx.performAndExpectResponse();
        await ctx.performAndExpectResponse();
        await ctx.performAndExpectResponse();

        expect(ctx.job.exhausted()).toBeFalse();
        expect(ctx.job.lastError).toBeUndefined();
      });
    });

    describe('when the client request fails', () => {
      const expectedError = new RequestFailed(502, fullUrl);

      beforeEach(() => {
        ctx.stubGet('[]', 502);
      });

      it('does not call enqueueActions', async () => {
        await ctx.job.perform(ctx.logContext).catch(() => {});

        expect(ctx.resourceRequest.enqueueActions).not.toHaveBeenCalled();
      });

      it('registers failure and increments attempts', async () => {
        expect(ctx.job.lastError).toBeUndefined();

        await ctx.job.perform(ctx.logContext).catch(() => {});
        await ctx.job.perform(ctx.logContext).catch(() => {});
        expect(ctx.job.exhausted()).toBeFalse();
        expect(ctx.job.lastError).toEqual(expectedError);

        await ctx.job.perform(ctx.logContext).catch(() => {});
        expect(ctx.job.exhausted()).toBeTrue();
        expect(ctx.job.lastError).toEqual(expectedError);
      });

      it('logs the error', async () => {
        await ctx.job.perform(ctx.logContext).catch(() => {});

        expect(ctx.logContext.error).toHaveBeenCalledWith(jasmine.stringContaining(ctx.job.id));
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
        ctx.rebuildJob({ requestUrl, jobParameters });
        ctx.stubEnqueueMethods();
        ctx.stubGet();

        await ctx.performAndExpectResponse();

        expect(axios.get).toHaveBeenCalledWith(expectedUrl, ResourceRequestJobSpecUtils.expectedRequestOptions);
      });
    });
  });
});
