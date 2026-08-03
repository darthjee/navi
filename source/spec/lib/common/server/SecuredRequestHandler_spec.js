import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { SecuredRequestHandler } from '../../../../lib/common/server/SecuredRequestHandler.js';
import { ForbiddenError } from '../../../../lib/exceptions/http/ForbiddenError.js';

describe('SecuredRequestHandler', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { headers: { authorization: 'Bearer secret-token' } };
    res = { json: jasmine.createSpy('json') };
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
    });

    describe('when the token is missing from the request', () => {
      it('throws ForbiddenError', async () => {
        req = { headers: {} };

        await expectAsync(new SecuredRequestHandler(req, res, 'secret-token').handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });
    });

    describe('when the request token does not match the configured token', () => {
      it('throws ForbiddenError', async () => {
        req = { headers: { authorization: 'Bearer wrong-token' } };

        await expectAsync(new SecuredRequestHandler(req, res, 'secret-token').handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });
    });

    describe('when the Authorization header uses a different scheme', () => {
      it('throws ForbiddenError', async () => {
        req = { headers: { authorization: 'Basic secret-token' } };

        await expectAsync(new SecuredRequestHandler(req, res, 'secret-token').handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
      });
    });

    describe('when no token is configured', () => {
      it('throws ForbiddenError even when a token is provided', async () => {
        await expectAsync(new SecuredRequestHandler(req, res, null).handle())
          .toBeRejectedWith(jasmine.any(ForbiddenError));
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
