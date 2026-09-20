import { LoggerUtils } from './LoggerUtils.js';
import { Logger } from '../../../lib/common/utils/logging/Logger.js';
import { ConflictError } from '../../../lib/exceptions/http/ConflictError.js';
import { ForbiddenError } from '../../../lib/exceptions/http/ForbiddenError.js';
import { NotFoundError } from '../../../lib/exceptions/http/NotFoundError.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { RouteRegister } from '../../../lib/server/RouteRegister.js';

/**
 * Error scenarios shared by every verb of RouteRegister.
 * @type {Array<object>}
 */
const ERROR_SCENARIOS = [
  {
    name: 'a ConflictError',
    build: () => new ConflictError(),
    status: 409,
    bodyName: 'a Conflict error body',
    body: { error: 'Conflict' },
  },
  {
    name: 'a ForbiddenError',
    build: () => new ForbiddenError(),
    status: 403,
    bodyName: 'a Forbidden error body',
    body: { error: 'Forbidden' },
  },
  {
    name: 'a NotFoundError',
    build: () => new NotFoundError('Not found'),
    status: 404,
    bodyName: 'the error message body',
    body: { error: 'Not found' },
  },
  {
    name: 'an unexpected error',
    build: () => new Error('Unexpected'),
    status: 500,
    bodyName: 'an internal server error body',
    body: { error: 'Internal Server Error' },
  },
];

/**
 * Test utility for the RouteRegister specs.
 *
 * Shares the router/register setup, the route invocation and the per-error
 * scenarios between the GET, POST and PATCH specs.
 */
class RouteRegisterUtils {
  /**
   * Installs the shared beforeEach/afterEach hooks for RouteRegister specs.
   * @param {Array<string>} [methods=[]] - Router methods to stub besides `get`, which is always stubbed.
   * @returns {{router: object, register: RouteRegister}} Context reassigned before each spec.
   */
  static setup(methods = []) {
    const ctx = {};

    beforeEach(() => {
      Logger.suppress();
      LogRegistry.build();
      LoggerUtils.stubLoggerMethods();
      ctx.router = {};
      ['get', ...methods].forEach((method) => {
        ctx.router[method] = jasmine.createSpy(method);
      });
      ctx.register = new RouteRegister(ctx.router);
    });

    afterEach(() => {
      LogRegistry.reset();
      Logger.reset();
    });

    return ctx;
  }

  /**
   * Registers a route and invokes the callback handed over to the router.
   * @param {object} params - Invocation options.
   * @param {object} params.ctx - Context returned by {@link RouteRegisterUtils.setup}.
   * @param {object} params.verb - Verb configuration (see {@link RouteRegisterUtils.itBehavesLikeRouteRegistration}).
   * @param {string} params.route - Route to register.
   * @param {object} params.handler - Handler registered on the route.
   * @param {object} [params.req={}] - Request passed to the route callback.
   * @param {object} [params.res={}] - Response passed to the route callback.
   * @returns {Promise<void>} Resolves once the route callback has finished.
   */
  static async invoke({ ctx, verb, route, handler, req = {}, res = {} }) {
    ctx.register[verb.registerName]({ route, handler });

    const callback = ctx.router[verb.method].calls.mostRecent().args[1];
    await callback(req, res);
  }

  /**
   * Generates the scenarios every RouteRegister verb must satisfy.
   * @param {object} ctx - Context returned by {@link RouteRegisterUtils.setup}.
   * @param {object} verb - Verb configuration.
   * @param {string} verb.method - Router method (`get`, `post` or `patch`).
   * @param {string} verb.registerName - RouteRegister method (`register`, `registerPost` or `registerPatch`).
   * @param {string} verb.httpMethod - HTTP method name used in requests and logs.
   * @param {string} verb.route - Route used in the scenarios.
   * @param {Function} verb.failWith - Receives an error and returns a handler that fails with it.
   * @returns {void}
   */
  static itBehavesLikeRouteRegistration(ctx, verb) {
    const { method, httpMethod, route } = verb;

    it(`registers a ${httpMethod} route on the router`, () => {
      ctx.register[verb.registerName]({ route, handler: { handle: jasmine.createSpy('handle') } });

      expect(ctx.router[method]).toHaveBeenCalledWith(route, jasmine.any(Function));
    });

    it('calls handler.handle when the route is triggered', async () => {
      const handler = { handle: jasmine.createSpy('handle') };
      const req = {};
      const res = {};

      await RouteRegisterUtils.invoke({ ctx, verb, route, handler, req, res });

      expect(handler.handle).toHaveBeenCalledWith(req, res);
    });

    it('logs debug with method, path and status on success', async () => {
      const handler = { handle: jasmine.createSpy('handle') };
      const req = { method: httpMethod, path: route };

      await RouteRegisterUtils.invoke({ ctx, verb, route, handler, req, res: { statusCode: 200 } });

      expect(Logger.debug).toHaveBeenCalledWith(`${httpMethod} ${route} 200`);
    });

    ERROR_SCENARIOS.forEach((scenario) => {
      RouteRegisterUtils.#itHandlesError(ctx, verb, scenario);
    });
  }

  /**
   * Generates the scenarios for a handler failing with a given error.
   * @param {object} ctx - Context returned by {@link RouteRegisterUtils.setup}.
   * @param {object} verb - Verb configuration.
   * @param {object} scenario - Entry of the error scenarios table.
   * @param {string} scenario.name - Description of the error used in the describe title.
   * @param {Function} scenario.build - Builds the error thrown by the handler.
   * @param {number} scenario.status - Expected HTTP status.
   * @param {string} scenario.bodyName - Description of the expected body used in the it title.
   * @param {object} scenario.body - Expected JSON body.
   * @returns {void}
   */
  static #itHandlesError(ctx, verb, { name, build, status, bodyName, body }) {
    const { httpMethod, route } = verb;
    let jsonSpy;
    let res;

    describe(`when the handler throws ${name}`, () => {
      beforeEach(async () => {
        jsonSpy = jasmine.createSpy('json');
        res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };

        await RouteRegisterUtils.invoke({
          ctx,
          verb,
          route,
          handler: verb.failWith(build()),
          req: { method: httpMethod, path: route },
          res,
        });
      });

      it(`responds with ${status}`, () => {
        expect(res.status).toHaveBeenCalledWith(status);
      });

      it(`responds with ${bodyName}`, () => {
        expect(jsonSpy).toHaveBeenCalledWith(body);
      });

      it(`logs debug with method, path and ${status} status`, () => {
        expect(Logger.debug).toHaveBeenCalledWith(`${httpMethod} ${route} ${status}`);
      });
    });
  }
}

export { RouteRegisterUtils };
