import { JobRegistry } from 'deku-swarm';
import { NamespaceMap } from '../../../lib/registry/namespace/NamespaceMap.js';
import { ApiEngineStartHandler } from '../../../lib/server/handlers/api/ApiEngineStartHandler.js';
import { Application } from '../../../lib/services/application/Application.js';

/**
 * Test utility shared by the ApiEngineStartHandler spec files.
 */
class ApiEngineStartHandlerSpecUtils {
  /**
   * Installs a beforeEach that builds the `res` double (with `json`/`status`
   * spies) and stubs `JobRegistry.enqueue`, and an afterEach that resets
   * the Application and the NamespaceMap.
   *
   * The returned context object is refilled on every beforeEach, so specs
   * must read its fields lazily (inside `it`/`beforeEach` blocks). It also
   * exposes `processBody` and `expectRunningResponse` bound to itself.
   * @returns {{res: {json: jasmine.Spy, status: jasmine.Spy},
   *   processBody: Function, expectRunningResponse: Function}} The shared context.
   */
  static setup() {
    const ctx = {
      processBody: (body) => ApiEngineStartHandlerSpecUtils.processBody(ctx, body),
      expectRunningResponse: (enqueued, skippedResources = []) => (
        ApiEngineStartHandlerSpecUtils.expectRunningResponse(ctx, enqueued, skippedResources)
      ),
    };

    beforeEach(() => {
      ctx.res = {
        json: jasmine.createSpy('json'),
        status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }),
      };
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      Application.reset();
      NamespaceMap.reset();
    });

    return ctx;
  }

  /**
   * Processes a request with the given body through a new ApiEngineStartHandler.
   * @param {{res: object}} ctx The shared context returned by {@link ApiEngineStartHandlerSpecUtils.setup}.
   * @param {object} body The request body.
   * @returns {Promise} The result of the handler's `process()`.
   */
  static processBody(ctx, body) {
    return new ApiEngineStartHandler({ body }, ctx.res, 'token').process();
  }

  /**
   * Asserts the response was a running status with the given enqueue result.
   * @param {{res: object}} ctx The shared context returned by {@link ApiEngineStartHandlerSpecUtils.setup}.
   * @param {Array} enqueued The expected enqueued resources.
   * @param {Array} [skippedResources] The expected skipped resources.
   * @returns {void}
   */
  static expectRunningResponse(ctx, enqueued, skippedResources = []) {
    expect(ctx.res.json).toHaveBeenCalledWith({ status: 'running', enqueued, skippedResources });
  }
}

export { ApiEngineStartHandlerSpecUtils };
