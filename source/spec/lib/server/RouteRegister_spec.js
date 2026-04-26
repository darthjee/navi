import { ForbiddenError } from '../../../lib/exceptions/ForbiddenError.js';
import { RouteRegister } from '../../../lib/server/RouteRegister.js';

describe('RouteRegister', () => {
  let router;
  let register;

  beforeEach(() => {
    router = { get: jasmine.createSpy('get') };
    register = new RouteRegister(router);
  });

  describe('#register', () => {
    it('registers a GET route on the router', () => {
      const handler = { handle: jasmine.createSpy('handle') };

      register.register({ route: '/stats.json', handler });

      expect(router.get).toHaveBeenCalledWith('/stats.json', jasmine.any(Function));
    });

    it('calls handler.handle when the route is triggered', () => {
      const handler = { handle: jasmine.createSpy('handle') };
      const req = {};
      const res = {};

      register.register({ route: '/stats.json', handler });

      const callback = router.get.calls.mostRecent().args[1];
      callback(req, res);

      expect(handler.handle).toHaveBeenCalledWith(req, res);
    });

    describe('when the handler throws a ForbiddenError', () => {
      it('responds with 403', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new ForbiddenError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/assets/*path', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('responds with a Forbidden error body', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new ForbiddenError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/assets/*path', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Forbidden' });
      });

      it('re-throws other errors', () => {
        const otherError = new Error('Unexpected');
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(otherError),
        };
        const req = {};
        const res = {};

        register.register({ route: '/some-route', handler });

        const callback = router.get.calls.mostRecent().args[1];

        expect(() => callback(req, res)).toThrow(otherError);
      });
    });
  });
});
