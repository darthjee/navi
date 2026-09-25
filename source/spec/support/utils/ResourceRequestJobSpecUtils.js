import { AxiosUtils } from './AxiosUtils.js';
import { LogContextUtils } from './LogContextUtils.js';
import { LoggerUtils } from './LoggerUtils.js';
import { ClientFactory } from '../factories/ClientFactory.js';
import { NamespaceMapFactory } from '../factories/NamespaceMapFactory.js';
import { ResourceRequestFactory } from '../factories/ResourceRequestFactory.js';
import { ResourceRequestJobFactory } from '../factories/ResourceRequestJobFactory.js';

/**
 * Test utility shared by the ResourceRequestJob spec files.
 */
class ResourceRequestJobSpecUtils {
  static baseUrl = 'http://example.com';
  static url = '/categories.json';
  static fullUrl = 'http://example.com/categories.json';
  static status = 200;

  /**
   * The request options expected to be passed to `axios.get`.
   *
   * Built lazily because `jasmine.any` is only available at spec runtime.
   * @returns {object} The expected request options.
   */
  static get expectedRequestOptions() {
    return {
      timeout: 5000,
      responseType: 'text',
      headers: {},
      maxRedirects: 0,
      validateStatus: jasmine.any(Function),
    };
  }

  /**
   * Installs a beforeEach that stubs the logger, builds the log context,
   * the default client / clients map and the job.
   *
   * The returned context object is refilled on every beforeEach, so specs
   * must read its fields lazily (inside `it`/`beforeEach` blocks). It also
   * exposes `rebuildJob`, `stubEnqueueMethods`, `stubGet`,
   * `performAndExpectResponse` and `prepareHook` bound to itself.
   * @returns {object} The shared context.
   */
  static setup() {
    const ctx = {
      rebuildJob: (options) => ResourceRequestJobSpecUtils.rebuildJob(ctx, options),
      stubEnqueueMethods: () => ResourceRequestJobSpecUtils.stubEnqueueMethods(ctx),
      stubGet: (body, statusCode) => ResourceRequestJobSpecUtils.stubGet(ctx, body, statusCode),
      performAndExpectResponse: () => ResourceRequestJobSpecUtils.performAndExpectResponse(ctx),
      prepareHook: (options) => ResourceRequestJobSpecUtils.prepareHook(ctx, options),
    };

    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      ctx.logContext = LogContextUtils.build();
      ctx.client = ClientFactory.build({ baseUrl: ResourceRequestJobSpecUtils.baseUrl });
      ctx.clients = NamespaceMapFactory.build({ clients: { default: ctx.client } });

      ctx.rebuildJob();
    });

    return ctx;
  }

  /**
   * Rebuilds `resourceRequest`, `parameters` and `job` on the context.
   * @param {object} ctx The shared context returned by {@link ResourceRequestJobSpecUtils.setup}.
   * @param {object} [options] The rebuild options.
   * @param {string} [options.requestUrl] The resource request URL.
   * @param {object} [options.jobParameters] The job parameters.
   * @param {object} [options.resourceRequestAttributes] Extra resource request attributes.
   * @param {object} [options.clients] Clients map replacing the one on the context.
   * @returns {void}
   */
  static rebuildJob(ctx, {
    requestUrl = ResourceRequestJobSpecUtils.url,
    jobParameters = {},
    resourceRequestAttributes = {},
    clients = ctx.clients,
  } = {}) {
    ctx.clients = clients;
    ctx.resourceRequest = ResourceRequestFactory.build({
      url: requestUrl,
      status: ResourceRequestJobSpecUtils.status,
      ...resourceRequestAttributes,
    });
    ctx.parameters = jobParameters;
    ctx.job = ResourceRequestJobFactory.build({
      resourceRequest: ctx.resourceRequest,
      clients: ctx.clients,
      parameters: ctx.parameters,
    });
  }

  /**
   * Stubs `enqueueActions` and `enqueuePaginatedActions` on the resource request.
   * @param {object} ctx The shared context returned by {@link ResourceRequestJobSpecUtils.setup}.
   * @returns {void}
   */
  static stubEnqueueMethods(ctx) {
    spyOn(ctx.resourceRequest, 'enqueueActions').and.stub();
    spyOn(ctx.resourceRequest, 'enqueuePaginatedActions').and.stub();
  }

  /**
   * Stubs `axios.get` and stores the stubbed response on the context.
   * @param {object} ctx The shared context returned by {@link ResourceRequestJobSpecUtils.setup}.
   * @param {string} [body] The response body.
   * @param {number} [statusCode] The response status code.
   * @returns {void}
   */
  static stubGet(ctx, body = '[]', statusCode = 200) {
    ctx.response = AxiosUtils.stubGet(statusCode, body);
  }

  /**
   * Asserts the job's `perform` resolves with the stubbed response.
   * @param {object} ctx The shared context returned by {@link ResourceRequestJobSpecUtils.setup}.
   * @returns {Promise} Resolves once the expectation completes.
   */
  static async performAndExpectResponse(ctx) {
    await expectAsync(ctx.job.perform(ctx.logContext)).toBeResolvedTo(ctx.response);
  }

  /**
   * Prepares a hook scenario: rebuilds the job, spies the predicate to return
   * the given value, stubs the hook enqueue method, the enqueue methods and
   * the GET request.
   * @param {object} ctx The shared context returned by {@link ResourceRequestJobSpecUtils.setup}.
   * @param {object} options The hook options.
   * @param {string} options.predicate The predicate method name (e.g. `hasAssets`).
   * @param {boolean} options.returnValue The value returned by the predicate.
   * @param {string} options.enqueueMethod The hook enqueue method name to stub.
   * @param {string} [options.body] The response body.
   * @returns {void}
   */
  static prepareHook(ctx, { predicate, returnValue, enqueueMethod, body = '[]' }) {
    ctx.rebuildJob();
    spyOn(ctx.resourceRequest, predicate).and.returnValue(returnValue);
    spyOn(ctx.resourceRequest, enqueueMethod).and.stub();
    ctx.stubEnqueueMethods();
    ctx.stubGet(body);
  }
}

export { ResourceRequestJobSpecUtils };
