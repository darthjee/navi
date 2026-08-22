import axios from 'axios';
import { RequestFailed } from '../../../lib/exceptions/request/RequestFailed.js';
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

  const rebuildJob = ({ emitUrl = url, method = 'POST', status = undefined, jobItem = item, jobParameters = {} } = {}) => {
    emit = ResourceRequestEmitFactory.build({ url: emitUrl, method, status });
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

      it('exhausts after maxRetries (default 3) failed attempts', async () => {
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
});
