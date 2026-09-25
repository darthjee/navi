import axios from 'axios';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('Client', () => {
  const baseUrl = 'http://example.com';

  let client;
  let logContext;

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    client = ClientFactory.build({ baseUrl });
  });


  describe('#emit', () => {
    const resourceUrl = '/items';
    const fullEmitUrl = 'http://example.com/items';
    const body = { name: 'item' };

    const axiosMethodByVerb = { POST: 'post', PUT: 'put', PATCH: 'patch' };
    const stubByVerb = { POST: 'stubPost', PUT: 'stubPut', PATCH: 'stubPatch' };

    ['POST', 'PUT', 'PATCH'].forEach((method) => {
      describe(`when method is ${method}`, () => {
        it('sends the body as the JSON payload, reusing baseUrl/headers/timeout', async () => {
          const response = AxiosUtils[stubByVerb[method]](200);

          await expectAsync(client.emit(method, resourceUrl, body, 200, logContext)).toBeResolvedTo(response);
          expect(axios[axiosMethodByVerb[method]]).toHaveBeenCalledWith(fullEmitUrl, body, {
            timeout: 5000,
            headers: {},
            validateStatus: jasmine.any(Function),
          });
        });
      });
    });

    describe('per-call headers', () => {
      describe('when no headers argument is given', () => {
        it('sends exactly the client headers', async () => {
          client = ClientFactory.build({ baseUrl, headers: { 'X-Client': 'base' } });
          AxiosUtils.stubPost(200);

          await client.emit('POST', resourceUrl, body, 200, logContext);

          expect(axios.post).toHaveBeenCalledWith(fullEmitUrl, body, {
            timeout: 5000,
            headers: { 'X-Client': 'base' },
            validateStatus: jasmine.any(Function),
          });
        });
      });

      describe('when the per-call headers have disjoint keys', () => {
        it('sends the union of client and per-call headers', async () => {
          client = ClientFactory.build({ baseUrl, headers: { 'X-Client': 'base' } });
          AxiosUtils.stubPost(200);

          await client.emit('POST', resourceUrl, body, 200, logContext, { 'X-Emit': 'extra' });

          expect(axios.post).toHaveBeenCalledWith(fullEmitUrl, body, {
            timeout: 5000,
            headers: { 'X-Client': 'base', 'X-Emit': 'extra' },
            validateStatus: jasmine.any(Function),
          });
        });
      });

      describe('when a per-call header collides with a client header', () => {
        it('uses the per-call value and keeps the other client headers', async () => {
          client = ClientFactory.build({
            baseUrl,
            headers: { Authorization: 'Bearer base', 'X-Client': 'base' },
          });
          AxiosUtils.stubPut(200);

          await client.emit('PUT', resourceUrl, body, 200, logContext, { Authorization: 'Bearer override' });

          expect(axios.put).toHaveBeenCalledWith(fullEmitUrl, body, {
            timeout: 5000,
            headers: { Authorization: 'Bearer override', 'X-Client': 'base' },
            validateStatus: jasmine.any(Function),
          });
        });
      });
    });

    describe('when no expectedStatus is given', () => {
      [200, 201, 204].forEach((statusCode) => {
        it(`treats ${statusCode} as a success`, async () => {
          const response = AxiosUtils.stubPost(statusCode);

          await expectAsync(client.emit('POST', resourceUrl, body, undefined, logContext)).toBeResolvedTo(response);
        });
      });

      it('throws RequestFailed for a non-2xx response', async () => {
        AxiosUtils.stubPost(404);

        await expectAsync(client.emit('POST', resourceUrl, body, undefined, logContext)).toBeRejectedWith(
          jasmine.objectContaining({ name: 'RequestFailed', statusCode: 404, url: fullEmitUrl }),
        );
      });
    });

    describe('when an explicit expectedStatus is given', () => {
      it('succeeds only on an exact match', async () => {
        const response = AxiosUtils.stubPost(201);

        await expectAsync(client.emit('POST', resourceUrl, body, 201, logContext)).toBeResolvedTo(response);
      });

      it('throws RequestFailed for a different status, even a different 2xx one', async () => {
        AxiosUtils.stubPost(200);

        await expectAsync(client.emit('POST', resourceUrl, body, 201, logContext)).toBeRejectedWith(
          jasmine.objectContaining({ name: 'RequestFailed', statusCode: 200, url: fullEmitUrl }),
        );
      });
    });

    describe('when the request fails with a network error', () => {
      it('propagates the error and logs it', async () => {
        const error = new Error('network down');
        AxiosUtils.stubPostRejection(error);

        await expectAsync(client.emit('POST', resourceUrl, body, 200, logContext)).toBeRejectedWith(error);
        expect(logContext.error).toHaveBeenCalled();
      });
    });
  });
});
