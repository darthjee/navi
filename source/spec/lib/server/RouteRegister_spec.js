import { ConflictError } from '../../../lib/exceptions/ConflictError.js';
import { ForbiddenError } from '../../../lib/exceptions/ForbiddenError.js';
import { NotFoundError } from '../../../lib/exceptions/NotFoundError.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { RouteRegister } from '../../../lib/server/RouteRegister.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

describe('RouteRegister', () => {
  let router;
  let register;

  beforeEach(() => {
    Logger.suppress();
    LogRegistry.build();
    LoggerUtils.stubLoggerMethods();
    router = { get: jasmine.createSpy('get'), patch: jasmine.createSpy('patch') };
    register = new RouteRegister(router);
  });

  afterEach(() => {
    LogRegistry.reset();
    Logger.reset();
    EngineEvents.reset();
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

    it('logs debug with method, path and status on success', () => {
      const handler = { handle: jasmine.createSpy('handle') };
      const req = { method: 'GET', path: '/stats.json' };
      const res = { statusCode: 200 };

      register.register({ route: '/stats.json', handler });

      const callback = router.get.calls.mostRecent().args[1];
      callback(req, res);

      expect(Logger.debug).toHaveBeenCalledWith('GET /stats.json 200');
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

      it('logs debug with method, path and 403 status', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new ForbiddenError()),
        };
        const req = { method: 'GET', path: '/assets/image.png' };
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/assets/*path', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(Logger.debug).toHaveBeenCalledWith('GET /assets/image.png 403');
      });
    });

    describe('when the handler throws a NotFoundError', () => {
      it('responds with 404', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new NotFoundError('Job not found')),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/job/:id.json', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
      });

      it('responds with the error message body', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new NotFoundError('Job not found')),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/job/:id.json', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Job not found' });
      });

      it('logs debug with method, path and 404 status', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new NotFoundError('Job not found')),
        };
        const req = { method: 'GET', path: '/job/42.json' };
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/job/:id.json', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(Logger.debug).toHaveBeenCalledWith('GET /job/42.json 404');
      });
    });

    describe('when the handler throws an unexpected error', () => {
      it('responds with 500', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new Error('Unexpected')),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/some-route', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });

      it('responds with an internal server error body', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new Error('Unexpected')),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/some-route', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });

      it('logs debug with method, path and 500 status', () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.throwError(new Error('Unexpected')),
        };
        const req = { method: 'GET', path: '/some-route' };
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.register({ route: '/some-route', handler });

        const callback = router.get.calls.mostRecent().args[1];
        callback(req, res);

        expect(Logger.debug).toHaveBeenCalledWith('GET /some-route 500');
      });
    });
  });

  describe('#registerPatch', () => {
    it('registers a PATCH route on the router', () => {
      const handler = { handle: jasmine.createSpy('handle') };

      register.registerPatch({ route: '/engine/pause', handler });

      expect(router.patch).toHaveBeenCalledWith('/engine/pause', jasmine.any(Function));
    });

    it('calls handler.handle when the route is triggered', async () => {
      const handler = { handle: jasmine.createSpy('handle').and.returnValue(Promise.resolve()) };
      const req = {};
      const res = {};

      register.registerPatch({ route: '/engine/pause', handler });

      const callback = router.patch.calls.mostRecent().args[1];
      await callback(req, res);

      expect(handler.handle).toHaveBeenCalledWith(req, res);
    });

    it('logs debug with method, path and status on success', async () => {
      const handler = { handle: jasmine.createSpy('handle').and.returnValue(Promise.resolve()) };
      const req = { method: 'PATCH', path: '/engine/pause' };
      const res = { statusCode: 200 };

      register.registerPatch({ route: '/engine/pause', handler });

      const callback = router.patch.calls.mostRecent().args[1];
      await callback(req, res);

      expect(Logger.debug).toHaveBeenCalledWith('PATCH /engine/pause 200');
    });

    describe('when the handler throws a ConflictError', () => {
      it('responds with 409', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new ConflictError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPatch({ route: '/engine/pause', handler });

        const callback = router.patch.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
      });

      it('responds with a Conflict error body', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new ConflictError()),
        };
        const req = {};
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPatch({ route: '/engine/pause', handler });

        const callback = router.patch.calls.mostRecent().args[1];
        await callback(req, res);

        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Conflict' });
      });

      it('logs debug with method, path and 409 status', async () => {
        const handler = {
          handle: jasmine.createSpy('handle').and.rejectWith(new ConflictError()),
        };
        const req = { method: 'PATCH', path: '/engine/pause' };
        const jsonSpy = jasmine.createSpy('json');
        const res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        register.registerPatch({ route: '/engine/pause', handler });

        const callback = router.patch.calls.mostRecent().args[1];
        await callback(req, res);

        expect(Logger.debug).toHaveBeenCalledWith('PATCH /engine/pause 409');
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

        register.registerPatch({ route: '/engine/pause', handler });

        const callback = router.patch.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
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

        register.registerPatch({ route: '/engine/pause', handler });

        const callback = router.patch.calls.mostRecent().args[1];
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

        register.registerPatch({ route: '/engine/pause', handler });

        const callback = router.patch.calls.mostRecent().args[1];
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
