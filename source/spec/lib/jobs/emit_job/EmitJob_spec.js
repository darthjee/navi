import axios from 'axios';
import { RequestFailed } from '../../../../lib/exceptions/request/RequestFailed.js';
import { ClientFactory } from '../../../support/factories/ClientFactory.js';
import { NamespaceMapFactory } from '../../../support/factories/NamespaceMapFactory.js';
import { AxiosUtils } from '../../../support/utils/AxiosUtils.js';
import { EmitJobSpecUtils } from '../../../support/utils/EmitJobSpecUtils.js';

const { url, fullUrl, item, expectedRequestOptions } = EmitJobSpecUtils;

describe('EmitJob', () => {
  const ctx = EmitJobSpecUtils.setup();
  let response;

  const itForwardsToClientEmit = (example) => EmitJobSpecUtils.itForwardsToClientEmit(ctx, example);

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(ctx.job.id).toEqual('id');
    });
  });

  describe('#arguments', () => {
    [
      {
        description: 'for a plain URL',
        emitUrl: url,
        jobParameters: {},
        expectedArguments: { url, method: 'POST' },
      },
      {
        description: 'for a parameterized URL',
        emitUrl: '/items/{:id}',
        jobParameters: { id: 7 },
        expectedArguments: { url: '/items/7', method: 'POST' },
      },
    ].forEach(({ description, emitUrl, jobParameters, expectedArguments }) => {
      it(`returns the resolved URL and method ${description}`, () => {
        ctx.rebuildJob({ emitUrl, jobParameters });

        expect(ctx.job.arguments).toEqual(expectedArguments);
      });
    });
  });

  describe('#perform', () => {
    describe('when the emit is successful', () => {
      beforeEach(() => {
        response = AxiosUtils.stubPost(200, {});
      });

      it('resolves with the response', async () => {
        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
        expect(axios.post).toHaveBeenCalledWith(fullUrl, item, expectedRequestOptions);
      });

      it('logs debug when performing', async () => {
        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);

        expect(ctx.logContext.debug).toHaveBeenCalled();
      });

      it('does not exhaust after several successful attempts', async () => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
        }

        expect(ctx.job.exhausted()).toBeFalse();
        expect(ctx.job.lastError).toBeUndefined();
      });
    });

    describe('emit headers forwarding', () => {
      beforeEach(() => {
        spyOn(ctx.client, 'emit').and.resolveTo({ status: 200, data: {} });
      });

      [
        {
          description: 'when the emit configures headers',
          title: 'passes the configured headers as the 6th argument to client.emit',
          jobOptions: { headers: { 'X-Token': 'abc' } },
          expectedHeaders: { 'X-Token': 'abc' },
        },
        {
          description: 'when the emit configures no headers',
          title: 'passes an empty object as the 6th argument to client.emit',
          jobOptions: {},
          expectedHeaders: {},
        },
      ].forEach(itForwardsToClientEmit);
    });

    describe('emit body_template rendering', () => {
      beforeEach(() => {
        spyOn(ctx.client, 'emit').and.resolveTo({ status: 200, data: {} });
      });

      [
        {
          description: 'when the emit configures a body_template',
          title: 'sends the rendered body as the 3rd argument to client.emit, not the raw item',
          jobOptions: { bodyTemplate: { itemName: '{:name}' } },
          expectedBody: { itemName: 'widget' },
        },
        {
          description: 'when the emit configures no body_template',
          title: 'sends the raw item as the 3rd argument to client.emit, unchanged',
          jobOptions: {},
          expectedBody: item,
        },
      ].forEach(itForwardsToClientEmit);
    });

    [
      { method: 'PUT', axiosMethod: 'put', stub: 'stubPut' },
      { method: 'PATCH', axiosMethod: 'patch', stub: 'stubPatch' },
      { method: 'POST', axiosMethod: 'post', stub: 'stubPost' },
    ].forEach(({ method, axiosMethod, stub }) => {
      describe(`when the emit method is ${method}`, () => {
        beforeEach(() => {
          ctx.rebuildJob({ method });
          response = AxiosUtils[stub](200, {});
        });

        it('dispatches through the matching axios method', async () => {
          await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
          expect(axios[axiosMethod]).toHaveBeenCalledWith(fullUrl, item, expectedRequestOptions);
        });
      });
    });

    describe('when the emit url has parameters', () => {
      const paramUrl = '/items/{:id}';
      const resolvedFullUrl = 'http://example.com/items/42';

      beforeEach(() => {
        ctx.rebuildJob({ emitUrl: paramUrl, jobParameters: { id: 42 } });
        response = AxiosUtils.stubPost(200, {});
      });

      it('resolves placeholders using the job parameters and requests the resolved URL', async () => {
        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
        expect(axios.post).toHaveBeenCalledWith(resolvedFullUrl, item, expectedRequestOptions);
      });
    });

    describe('when no expected status is configured', () => {
      [200, 201, 204].forEach((statusCode) => {
        it(`treats ${statusCode} as a success`, async () => {
          response = AxiosUtils.stubPost(statusCode, {});

          await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
        });
      });

      it('fails when the response is not a 2xx', async () => {
        AxiosUtils.stubPost(404, {});

        await ctx.performIgnoringFailure();

        expect(ctx.job.lastError).toEqual(new RequestFailed(404, fullUrl));
      });
    });

    describe('when an explicit status is configured', () => {
      beforeEach(() => {
        ctx.rebuildJob({ status: 201 });
      });

      it('succeeds only on an exact match', async () => {
        response = AxiosUtils.stubPost(201, {});

        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
      });

      it('fails for a different status, even a different 2xx one', async () => {
        AxiosUtils.stubPost(200, {});

        await ctx.performIgnoringFailure();

        expect(ctx.job.lastError).toEqual(new RequestFailed(200, fullUrl));
      });
    });

    describe('when the emit fails', () => {
      const expectedError = new RequestFailed(502, fullUrl);

      beforeEach(() => {
        AxiosUtils.stubPostRejection({ response: { status: 502 } });
      });

      it('registers failure and increments attempts, then succeeds once the stub recovers', async () => {
        expect(ctx.job.lastError).toBeUndefined();

        await ctx.performIgnoringFailure();
        expect(ctx.job.exhausted()).toBeFalse();
        expect(ctx.job.lastError).toEqual(expectedError);

        response = { status: 200, data: {} };
        axios.post.and.returnValue(Promise.resolve(response));
        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);
      });

      it('logs the error', async () => {
        await ctx.performIgnoringFailure();

        expect(ctx.logContext.error).toHaveBeenCalledWith(jasmine.stringContaining(ctx.job.id));
      });

      it('exhausts after maxRetries (default 5, since 502 is retryable) failed attempts', async () => {
        await ctx.performIgnoringFailure(4);
        expect(ctx.job.exhausted()).toBeFalse();

        await ctx.performIgnoringFailure();
        expect(ctx.job.exhausted()).toBeTrue();
        expect(ctx.job.lastError).toEqual(expectedError);
      });
    });

    describe('namespace-aware client resolution', () => {
      let otherClient;

      beforeEach(() => {
        otherClient = ClientFactory.build({ name: 'other', baseUrl: 'http://other.example.com' });
        ctx.clients = NamespaceMapFactory.build({
          namespace: 'other',
          clients: { other: otherClient },
        });
        ctx.rebuildJob({ emitClient: { name: 'other', namespace: 'other' } });
      });

      it('resolves the client from the explicit target namespace', async () => {
        response = AxiosUtils.stubPost(200, {});

        await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(response);

        expect(axios.post).toHaveBeenCalledWith('http://other.example.com/items', item, expectedRequestOptions);
      });
    });
  });
});
