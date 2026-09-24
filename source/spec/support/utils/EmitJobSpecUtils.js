import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { ClientFactory } from '../factories/ClientFactory.js';
import { EmitJobFactory } from '../factories/EmitJobFactory.js';
import { NamespaceMapFactory } from '../factories/NamespaceMapFactory.js';
import { ResourceRequestEmitFactory } from '../factories/ResourceRequestEmitFactory.js';
import { LoggerUtils } from './LoggerUtils.js';

/**
 * Test utility shared by the EmitJob spec files.
 *
 * Specs call {@link EmitJobSpecUtils.setup} inside their top-level describe
 * and read the job, client, clients, logContext, emit and parameters from
 * the returned context object, which is refreshed on every beforeEach.
 */
class EmitJobSpecUtils {
  /**
   * Base URL of the default client.
   * @returns {string} The base URL.
   */
  static get baseUrl() {
    return 'http://example.com';
  }

  /**
   * Default emit URL.
   * @returns {string} The emit URL.
   */
  static get url() {
    return '/items';
  }

  /**
   * Default emit URL joined with the client base URL.
   * @returns {string} The full URL.
   */
  static get fullUrl() {
    return 'http://example.com/items';
  }

  /**
   * Default item emitted by the job.
   * @returns {object} The item.
   */
  static get item() {
    return { name: 'widget', id: 7 };
  }

  /**
   * Request options expected to be passed to axios.
   * @returns {object} The expected options.
   */
  static get expectedRequestOptions() {
    return {
      timeout: 5000,
      headers: {},
      validateStatus: jasmine.any(Function),
    };
  }

  /**
   * Installs the common beforeEach (logger stubs, logContext spy, default
   * client and namespace map, initial job build) and returns the mutable
   * context object refreshed by it.
   * @returns {object} The spec context.
   */
  static setup() {
    const ctx = {};

    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      ctx.logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
      ctx.client = ClientFactory.build({ baseUrl: EmitJobSpecUtils.baseUrl });
      ctx.clients = NamespaceMapFactory.build({ clients: { default: ctx.client } });
      ctx.response = undefined;

      EmitJobSpecUtils.rebuildJob(ctx);
    });

    return ctx;
  }

  /**
   * Rebuilds the emit, parameters and job on the given context.
   * @param {object} ctx The spec context.
   * @param {object} [options] Job build options.
   * @param {string} [options.emitUrl] Emit URL.
   * @param {string} [options.method] Emit HTTP method.
   * @param {number} [options.status] Expected status.
   * @param {object} [options.jobItem] Item to emit.
   * @param {object} [options.jobParameters] Job parameters.
   * @param {object} [options.headers] Emit headers.
   * @param {object} [options.bodyTemplate] Emit body template.
   * @param {number} [options.retries] Emit retries override.
   * @param {number} [options.cooldown] Emit cooldown override.
   * @param {object} [options.emitClient] Emit client reference.
   * @param {number} [options.extractionId] Extraction id.
   * @returns {void}
   */
  static rebuildJob(ctx, {
    emitUrl = EmitJobSpecUtils.url, method = 'POST', status = undefined, jobItem = EmitJobSpecUtils.item,
    jobParameters = {}, headers = undefined, bodyTemplate = undefined, retries = undefined, cooldown = undefined,
    emitClient = undefined, extractionId = undefined,
  } = {}) {
    ctx.emit = ResourceRequestEmitFactory.build({
      url: emitUrl, method, status, headers, body_template: bodyTemplate, retries, cooldown, client: emitClient,
    });
    ctx.parameters = jobParameters;
    ctx.job = EmitJobFactory.build({
      item: jobItem, emit: ctx.emit, clients: ctx.clients, parameters: ctx.parameters, extractionId,
    });
  }

  /**
   * Performs the context job the given number of times, swallowing failures.
   * @param {object} ctx The spec context.
   * @param {number} [times] Number of attempts.
   * @returns {Promise<void>} Resolves once all attempts have run.
   */
  static async performIgnoringFailure(ctx, times = 1) {
    for (let attempt = 0; attempt < times; attempt += 1) {
      await ctx.job.perform(ctx.logContext).catch(() => {});
    }
  }

  /**
   * Returns the first record in the EmissionRegistry.
   * @returns {object} The first emission record.
   */
  static firstRecord() {
    return EmissionRegistry.getRecords()[0];
  }

  /**
   * Shared example asserting that performing the job forwards the expected
   * body and headers to client.emit.
   * @param {object} ctx The spec context.
   * @param {object} example The example definition.
   * @param {string} example.description Describe block description.
   * @param {string} example.title It block title.
   * @param {object} example.jobOptions Options passed to rebuildJob.
   * @param {object} [example.expectedBody] Expected emitted body.
   * @param {object} [example.expectedHeaders] Expected emitted headers.
   * @returns {void}
   */
  static itForwardsToClientEmit(ctx, {
    description, title, jobOptions, expectedBody = EmitJobSpecUtils.item, expectedHeaders = {},
  }) {
    describe(description, () => {
      beforeEach(() => {
        EmitJobSpecUtils.rebuildJob(ctx, jobOptions);
      });

      it(title, async () => {
        await ctx.job.perform(ctx.logContext);

        expect(ctx.client.emit).toHaveBeenCalledWith(
          'POST', EmitJobSpecUtils.url, expectedBody, undefined, ctx.logContext, expectedHeaders,
        );
      });
    });
  }
}

export { EmitJobSpecUtils };
