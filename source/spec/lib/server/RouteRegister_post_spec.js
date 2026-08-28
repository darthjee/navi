import { ConflictError } from '../../../lib/exceptions/http/ConflictError.js';
import { ForbiddenError } from '../../../lib/exceptions/http/ForbiddenError.js';
import { NotFoundError } from '../../../lib/exceptions/http/NotFoundError.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { RouteRegister } from '../../../lib/server/RouteRegister.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('RouteRegister', () => {
  let router;
  let register;

  beforeEach(() => {
    Logger.suppress();
    LogRegistry.build();
    LoggerUtils.stubLoggerMethods();
    router = { get: jasmine.createSpy('get'), post: jasmine.createSpy('post') };
    register = new RouteRegister(router);
  });

  afterEach(() => {
    LogRegistry.reset();
    Logger.reset();
  });

  describe('#registerPost', () => {
    it('registers a POST route on the router', () => {
      const handler = { handle: jasmine.createSpy('handle') };

      register.registerPost({ route: '/api/config', handler });

      expect(router.post).toHaveBeenCalledWith('/api/config', jasmine.any(Function));
    });

    it('calls handler.handle when the route is triggered', async () => {
      const handler = { handle: jasmine.createSpy('handle').and.returnValue(Promise.resolve()) };
      const req = {};
      const res = {};

      register.registerPost({ route: '/api/config', handler });

      const callback = router.post.calls.mostRecent().args[1];
      await callback(req, res);

      expect(handler.handle).toHaveBeenCalledWith(req, res);
    });

    it('logs debug with method, path and status on success', async () => {
      const handler = { handle: jasmine.createSpy('handle').and.returnValue(Promise.resolve()) };
      const req = { method: 'POST', path: '/api/config' };
      const res = { statusCode: 200 };

      register.registerPost({ route: '/api/config', handler });

      const callback = router.post.calls.mostRecent().args[1];
      await callback(req, res);

      expect(Logger.debug).toHaveBeenCalledWith('POST /api/config 200');
    });

    describe('when the handler throws a ConflictError', () => {
      it('responds with 409', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new ConflictError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPost({ route: '/api/engine/start', handler });

        const callback = router.post.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
      });
    });

    describe('when the handler throws a ForbiddenError', () => {
      it('responds with 403', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new ForbiddenError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPost({ route: '/api/config', handler });

        const callback = router.post.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('responds with a Forbidden error body', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new ForbiddenError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPost({ route: '/api/config', handler });

        const callback = router.post.calls.mostRecent().args[1];
        await callback(req, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Forbidden' });
      });
    });

    describe('when the handler throws a NotFoundError', () => {
      it('responds with 404', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new NotFoundError('Not found')),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPost({ route: '/api/config', handler });

        const callback = router.post.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe('when the handler throws an unexpected error', () => {
      it('responds with 500', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new Error('Unexpected')),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPost({ route: '/api/config', handler });

        const callback = router.post.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
