import { RequestHandler } from '../../../lib/common/server/RequestHandler.js';
import { ForbiddenError } from '../../../lib/exceptions/http/ForbiddenError.js';
import { SecuredRequestHandler } from '../../../lib/server/SecuredRequestHandler.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('SecuredRequestHandler', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/config',
      headers: { authorization: 'Bearer secret-token' },
      body: { some: 'payload' },
    };
    res = { json: jasmine.createSpy('json') };

    spyOn(Logger, 'debug');
  });

  it('is an instance of RequestHandler', () => {
    expect(new SecuredRequestHandler(req, res, 'secret-token')).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when the token matches', () => {
      it('delegates to #process', async () => {
        const processSpy = spyOn(SecuredRequestHandler.prototype, 'process').and.stub();

        await new SecuredRequestHandler(req, res, 'secret-token').handle();

        expect(processSpy).toHaveBeenCalled();
      });

      it('logs the inbound request method, path and body', async () => {
        await new SecuredRequestHandler(req, res, 'secret-token').handle();

        expect(Logger.debug).toHaveBeenCalledOnceWith('Inbound request', {
          method: req.method,
          path: req.path,
          body: req.body,
        });
      });
    });

    describe('when the token is missing from the request', () => {
      it('throws ForbiddenError', async () => {
        req = { headers: {} };

        await expectAsync(new SecuredRequestHandler(req, res, 'secret-token').handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });

      it('does not log the inbound request', async () => {
        req = { headers: {} };

        await new SecuredRequestHandler(req, res, 'secret-token').handle()
          .catch(() => {});

        expect(Logger.debug).not.toHaveBeenCalled();
      });
    });

    describe('when the request token does not match the configured token', () => {
      it('throws ForbiddenError', async () => {
        req = { headers: { authorization: 'Bearer wrong-token' } };

        await expectAsync(new SecuredRequestHandler(req, res, 'secret-token').handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });

      it('does not log the inbound request', async () => {
        req = { headers: { authorization: 'Bearer wrong-token' } };

        await new SecuredRequestHandler(req, res, 'secret-token').handle()
          .catch(() => {});

        expect(Logger.debug).not.toHaveBeenCalled();
      });
    });

    describe('when the Authorization header uses a different scheme', () => {
      it('throws ForbiddenError', async () => {
        req = { headers: { authorization: 'Basic secret-token' } };

        await expectAsync(new SecuredRequestHandler(req, res, 'secret-token').handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });

      it('does not log the inbound request', async () => {
        req = { headers: { authorization: 'Basic secret-token' } };

        await new SecuredRequestHandler(req, res, 'secret-token').handle()
          .catch(() => {});

        expect(Logger.debug).not.toHaveBeenCalled();
      });
    });

    describe('when no token is configured', () => {
      it('throws ForbiddenError even when a token is provided', async () => {
        await expectAsync(new SecuredRequestHandler(req, res, null).handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });

      it('does not log the inbound request', async () => {
        await new SecuredRequestHandler(req, res, null).handle()
          .catch(() => {});

        expect(Logger.debug).not.toHaveBeenCalled();
      });
    });
  });

  describe('#process', () => {
    it('is a no-op by default', () => {
      expect(() => new SecuredRequestHandler(req, res, 'secret-token').process()).not.toThrow();
    });
  });

  describe('#request', () => {
    it('exposes the request object to subclasses', () => {
      class MyHandler extends SecuredRequestHandler {
        process() { return this.request; }
      }

      expect(new MyHandler(req, res, 'secret-token').process()).toBe(req);
    });
  });

  describe('#response', () => {
    it('exposes the response object to subclasses', () => {
      class MyHandler extends SecuredRequestHandler {
        process() { return this.response; }
      }

      expect(new MyHandler(req, res, 'secret-token').process()).toBe(res);
    });
  });
});
