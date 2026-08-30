import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/request/RequestFailed.js';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';
import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { EmitJobFactory } from '../../support/factories/EmitJobFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
import { ResourceRequestEmitFactory } from '../../support/factories/ResourceRequestEmitFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

const baseUrl = 'http://example.com';
const url = '/items';
const fullUrl = 'http://example.com/items';
const item = { name: 'widget', id: 7 };

const expectedRequestOptions = {
  timeout: 5000,
  headers: {},
  validateStatus: jasmine.any(Function),
};

describe('EmitJob', () => {
  let emit;
  let clients;
  let client;
  let parameters;
  let job;
  let logContext;
  let response;

  const rebuildJob = ({
    emitUrl = url, method = 'POST', status = undefined, jobItem = item, jobParameters = {}, headers = undefined,
  } = {}) => {
    emit = ResourceRequestEmitFactory.build({ url: emitUrl, method, status, headers });
    parameters = jobParameters;
    job = EmitJobFactory.build({ item: jobItem, emit, clients, parameters });
  };

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    client = ClientFactory.build({ baseUrl });
    clients = NamespaceMapFactory.build({ clients: { default: client } });

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
        rebuildJob({ emitUrl, jobParameters });

        expect(job.arguments).toEqual(expectedArguments);
      });
    });
  });

  describe('#perform', () => {
    describe('when the emit is successful', () => {
      beforeEach(() => {
        response = AxiosUtils.stubPost(200, {});
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(axios.post).toHaveBeenCalledWith(fullUrl, item, expectedRequestOptions);
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

    describe('emit headers forwarding', () => {
      beforeEach(() => {
        spyOn(client, 'emit').and.resolveTo({ status: 200, data: {} });
      });

      describe('when the emit configures headers', () => {
        beforeEach(() => {
          rebuildJob({ headers: { 'X-Token': 'abc' } });
        });

        it('passes the configured headers as the 6th argument to client.emit', async () => {
          await job.perform(logContext);

          expect(client.emit).toHaveBeenCalledWith('POST', url, item, undefined, logContext, { 'X-Token': 'abc' });
        });
      });

      describe('when the emit configures no headers', () => {
        it('passes an empty object as the 6th argument to client.emit', async () => {
          await job.perform(logContext);

          expect(client.emit).toHaveBeenCalledWith('POST', url, item, undefined, logContext, {});
        });
      });
    });

    [
      { method: 'PUT', axiosMethod: 'put', stub: 'stubPut' },
      { method: 'PATCH', axiosMethod: 'patch', stub: 'stubPatch' },
      { method: 'POST', axiosMethod: 'post', stub: 'stubPost' },
    ].forEach(({ method, axiosMethod, stub }) => {
      describe(`when the emit method is ${method}`, () => {
        beforeEach(() => {
          rebuildJob({ method });
          response = AxiosUtils[stub](200, {});
        });

        it('dispatches through the matching axios method', async () => {
          await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
          expect(axios[axiosMethod]).toHaveBeenCalledWith(fullUrl, item, expectedRequestOptions);
        });
      });
    });

    describe('when the emit url has parameters', () => {
      const paramUrl = '/items/{:id}';
      const resolvedFullUrl = 'http://example.com/items/42';

      beforeEach(() => {
        rebuildJob({ emitUrl: paramUrl, jobParameters: { id: 42 } });
        response = AxiosUtils.stubPost(200, {});
      });

      it('resolves placeholders using the job parameters and requests the resolved URL', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        expect(axios.post).toHaveBeenCalledWith(resolvedFullUrl, item, expectedRequestOptions);
      });
    });

    describe('when no expected status is configured', () => {
      [200, 201, 204].forEach((statusCode) => {
        it(`treats ${statusCode} as a success`, async () => {
          response = AxiosUtils.stubPost(statusCode, {});

          await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
        });
      });

      it('fails when the response is not a 2xx', async () => {
        AxiosUtils.stubPost(404, {});

        await job.perform(logContext).catch(() => {});

        expect(job.lastError).toEqual(new RequestFailed(404, fullUrl));
      });
    });

    describe('when an explicit status is configured', () => {
      beforeEach(() => {
        rebuildJob({ status: 201 });
      });

      it('succeeds only on an exact match', async () => {
        response = AxiosUtils.stubPost(201, {});

        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
      });

      it('fails for a different status, even a different 2xx one', async () => {
        AxiosUtils.stubPost(200, {});

        await job.perform(logContext).catch(() => {});

        expect(job.lastError).toEqual(new RequestFailed(200, fullUrl));
      });
    });

    describe('when the emit fails', () => {
      const expectedError = new RequestFailed(502, fullUrl);

      beforeEach(() => {
        AxiosUtils.stubPostRejection({ response: { status: 502 } });
      });

      it('registers failure and increments attempts, then succeeds once the stub recovers', async () => {
        expect(job.lastError).toBeUndefined();

        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);

        response = { status: 200, data: {} };
        axios.post.and.returnValue(Promise.resolve(response));
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
      });

      it('logs the error', async () => {
        await job.perform(logContext).catch(() => {});

        expect(logContext.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
      });

      it('exhausts after maxRetries (default 5, since 502 is retryable) failed attempts', async () => {
        await job.perform(logContext).catch(() => {});
        await job.perform(logContext).catch(() => {});
        await job.perform(logContext).catch(() => {});
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeFalse();

        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeTrue();
        expect(job.lastError).toEqual(expectedError);
      });
    });

    describe('namespace-aware client resolution', () => {
      let otherClient;

      beforeEach(() => {
        otherClient = ClientFactory.build({ name: 'other', baseUrl: 'http://other.example.com' });
        clients = NamespaceMapFactory.build({
          namespace: 'other',
          clients: { other: otherClient },
        });
        emit = ResourceRequestEmitFactory.build({ url, client: { name: 'other', namespace: 'other' } });
        parameters = {};
        job = EmitJobFactory.build({ item, emit, clients, parameters });
      });

      it('resolves the client from the explicit target namespace', async () => {
        response = AxiosUtils.stubPost(200, {});

        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);

        expect(axios.post).toHaveBeenCalledWith('http://other.example.com/items', item, expectedRequestOptions);
      });
    });
  });

  describe('emission tracking', () => {
    afterEach(() => {
      EmissionRegistry.reset();
    });

    describe('when the registry has been built', () => {
      beforeEach(() => {
        EmissionRegistry.build();
      });

      describe('when the emit is successful', () => {
        beforeEach(() => {
          response = AxiosUtils.stubPost(200, {});
        });

        it('records a success emission', async () => {
          await job.perform(logContext);

          const [record] = EmissionRegistry.getRecords();
          expect(record.status).toBe('success');
          expect(record.url).toBe(url);
          expect(record.method).toBe('POST');
          expect(record.httpStatus).toBe(200);
          expect(record.itemRef).toBe(7);
        });

        it('increments the emitted counter', async () => {
          await job.perform(logContext);

          expect(EmissionRegistry.counts.emitted).toBe(1);
        });
      });

      describe('when the emit fails with a retryable status', () => {
        beforeEach(() => {
          AxiosUtils.stubPostRejection({ response: { status: 502 } });
        });

        it('records a failed emission with the http status', async () => {
          await job.perform(logContext).catch(() => {});

          const [record] = EmissionRegistry.getRecords();
          expect(record.status).toBe('failed');
          expect(record.httpStatus).toBe(502);
          expect(record.error).toContain('502');
        });

        it('increments the failed counter', async () => {
          await job.perform(logContext).catch(() => {});

          expect(EmissionRegistry.counts).toEqual(jasmine.objectContaining({ failed: 1, dead: 0 }));
        });
      });

      describe('when the emit fails past maxRetries', () => {
        beforeEach(() => {
          emit = ResourceRequestEmitFactory.build({ url, retries: 1 });
          job = EmitJobFactory.build({ item, emit, clients, parameters: {} });
          AxiosUtils.stubPostRejection({ response: { status: 502 } });
        });

        it('records a dead emission', async () => {
          await job.perform(logContext).catch(() => {});

          const [record] = EmissionRegistry.getRecords();
          expect(record.status).toBe('dead');
        });

        it('increments the dead counter but not the failed counter', async () => {
          await job.perform(logContext).catch(() => {});

          expect(EmissionRegistry.counts).toEqual(jasmine.objectContaining({ failed: 0, dead: 1 }));
        });
      });

      describe('when the emit fails with a non-retryable 4xx', () => {
        beforeEach(() => {
          AxiosUtils.stubPostRejection({ response: { status: 404 } });
        });

        it('records a dead emission', async () => {
          await job.perform(logContext).catch(() => {});

          const [record] = EmissionRegistry.getRecords();
          expect(record.status).toBe('dead');
          expect(record.httpStatus).toBe(404);
        });
      });

      describe('when the emitted item has no id', () => {
        beforeEach(() => {
          rebuildJob({ jobItem: { name: 'no-id' } });
          response = AxiosUtils.stubPost(200, {});
        });

        it('records a null itemRef', async () => {
          await job.perform(logContext);

          expect(EmissionRegistry.getRecords()[0].itemRef).toBeNull();
        });
      });

      describe('when the success response carries no status', () => {
        beforeEach(() => {
          spyOn(client, 'emit').and.resolveTo(null);
        });

        it('records a null httpStatus', async () => {
          await job.perform(logContext);

          expect(EmissionRegistry.getRecords()[0].httpStatus).toBeNull();
        });
      });

      describe('when the emit fails with a network-level error', () => {
        beforeEach(() => {
          AxiosUtils.stubPostRejection(new Error('network down'));
        });

        it('records a failed emission with a null httpStatus', async () => {
          await job.perform(logContext).catch(() => {});

          const [record] = EmissionRegistry.getRecords();
          expect(record.status).toBe('failed');
          expect(record.httpStatus).toBeNull();
        });
      });
    });

    describe('when the registry has not been built', () => {
      beforeEach(() => {
        response = AxiosUtils.stubPost(200, {});
      });

      it('still performs without throwing', async () => {
        await expectAsync(job.perform(logContext)).toBeResolvedTo(response);
      });
    });
  });

  describe('#maxRetries', () => {
    const fail = (error) => { try { job._fail(error); } catch (_) { /* expected */ } };

    describe('when no emit.retries override is configured', () => {
      it('returns EmitJob.DEFAULT_MAX_RETRIES', () => {
        expect(job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
      });
    });

    describe('when emit.retries is configured', () => {
      beforeEach(() => {
        emit = ResourceRequestEmitFactory.build({ url, retries: 2 });
        job = EmitJobFactory.build({ item, emit, clients, parameters: {} });
      });

      it('returns the configured value', () => {
        expect(job.maxRetries).toBe(2);
      });
    });

    describe('when the last error is a retryable RequestFailed', () => {
      [500, 502, 503, 429, 408].forEach((statusCode) => {
        it(`keeps the configured maxRetries for a ${statusCode} response`, () => {
          fail(new RequestFailed(statusCode, fullUrl));

          expect(job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
        });
      });
    });

    describe('when the last error is a non-retryable RequestFailed (any other 4xx)', () => {
      [400, 401, 403, 404, 422].forEach((statusCode) => {
        it(`forces immediate exhaustion for a ${statusCode} response`, () => {
          fail(new RequestFailed(statusCode, fullUrl));

          expect(job.maxRetries).toBe(job._attempts);
          expect(job.exhausted()).toBeTrue();
        });
      });
    });

    describe('when the last error is a network-level error (not a RequestFailed)', () => {
      it('keeps the configured maxRetries, treating it as always retryable', () => {
        fail(new Error('network down'));

        expect(job.maxRetries).toBe(EmitJob.DEFAULT_MAX_RETRIES);
      });
    });
  });

  describe('#cooldown', () => {
    const fail = (error) => { try { job._fail(error); } catch (_) { /* expected */ } };

    describe('when no emit.cooldown override is configured and there is no Retry-After to honor', () => {
      it('returns EmitJob.DEFAULT_COOLDOWN', () => {
        expect(job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });

    describe('when emit.cooldown is configured', () => {
      beforeEach(() => {
        emit = ResourceRequestEmitFactory.build({ url, cooldown: 1234 });
        job = EmitJobFactory.build({ item, emit, clients, parameters: {} });
      });

      it('returns the configured value', () => {
        expect(job.cooldown).toBe(1234);
      });
    });

    describe('when the last error is a 429 with a parseable Retry-After header', () => {
      it('returns the Retry-After value converted to milliseconds', () => {
        fail(new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': '10' }));

        expect(job.cooldown).toBe(10000);
      });

      it('caps the value at EmitJob.RETRY_AFTER_CAP_MS', () => {
        fail(new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': '120' }));

        expect(job.cooldown).toBe(EmitJob.RETRY_AFTER_CAP_MS);
      });
    });

    describe('when the last error is a 429 without a Retry-After header', () => {
      it('falls back to the configured cooldown', () => {
        fail(new RequestFailed(429, fullUrl));

        expect(job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });

    describe('when the last error is a 429 with a non-numeric Retry-After header', () => {
      it('falls back to the configured cooldown', () => {
        fail(new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': 'not-a-number' }));

        expect(job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });

    describe('when the last error is a 429 with an HTTP-date Retry-After header', () => {
      it('treats it as unparseable and falls back to the configured cooldown', () => {
        fail(new RequestFailed(429, fullUrl, 'Request failed', { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' }));

        expect(job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });

    describe('when the last error is a non-429 RequestFailed carrying a Retry-After-like header', () => {
      it('returns the configured cooldown, ignoring the header', () => {
        fail(new RequestFailed(503, fullUrl, 'Request failed', { 'retry-after': '10' }));

        expect(job.cooldown).toBe(EmitJob.DEFAULT_COOLDOWN);
      });
    });
  });
});
