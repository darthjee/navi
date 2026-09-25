import { ResourceRequestParser } from '../../../lib/models/request/resource_request/ResourceRequestParser.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';
import { ExtractionJobFactory } from '../factories/ExtractionJobFactory.js';
import { ResourceRequestEmitFactory } from '../factories/ResourceRequestEmitFactory.js';

const emit = ResourceRequestEmitFactory.build({ method: 'POST', url: 'https://example.com/items/{:id}' });

/**
 * Test utility shared by the ExtractionJob spec files.
 *
 * Specs call {@link ExtractionJobSpecUtils.setup} inside their top-level
 * describe and read the job, rawBody, parser, parserImpl, parserRegistry,
 * jobRegistry and logContext from the returned context object, which is
 * refreshed on every beforeEach.
 */
class ExtractionJobSpecUtils {
  /**
   * Default emit configuration (same instance on every call).
   * @returns {object} The emit.
   */
  static get emit() {
    return emit;
  }

  /**
   * Default emit parameters.
   * @returns {object} The parameters.
   */
  static get parameters() {
    return { id: '42' };
  }

  /**
   * Default origin URL of the extraction.
   * @returns {string} The origin URL.
   */
  static get originUrl() {
    return 'https://example.com/list?page=1';
  }

  /**
   * A list with a single extracted item.
   * @returns {Array<object>} The items.
   */
  static get singleItem() {
    return [{ price: '42.50' }];
  }

  /**
   * A list with two extracted items.
   * @returns {Array<object>} The items.
   */
  static get twoItems() {
    return [{ price: '42.50' }, { price: '10.00' }];
  }

  /**
   * Installs the common beforeEach (logContext spy, raw body, parser, parser
   * registry and job registry) and returns the mutable context object
   * refreshed by it. The context also exposes `buildJob(overrides)`,
   * `performWith(items)`, `performIgnoringFailure()` and
   * `expectEmitEnqueued(item, extractionId)` bound to it.
   * @returns {object} The spec context.
   */
  static setup() {
    const ctx = {
      buildJob: (overrides) => ExtractionJobSpecUtils.buildJob(ctx, overrides),
      performWith: (items) => ExtractionJobSpecUtils.performWith(ctx, items),
      performIgnoringFailure: () => ExtractionJobSpecUtils.performIgnoringFailure(ctx),
      expectEmitEnqueued: (item, extractionId) => ExtractionJobSpecUtils.expectEmitEnqueued(ctx, item, extractionId),
    };

    beforeEach(() => {
      ctx.logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
      ctx.rawBody = 'price: $42.50 total';
      ctx.parser = new ResourceRequestParser({ type: 'regex', match: '\\$(\\d+\\.\\d+)', field: 'price' });
      ctx.parserImpl = jasmine.createSpyObj('parserImpl', ['extract']);
      ctx.parserRegistry = new ParserRegistry({ regex: ctx.parserImpl });
      ctx.jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
    });

    return ctx;
  }

  /**
   * Builds the job on the given context.
   * @param {object} ctx The spec context.
   * @param {object} [overrides] Job build overrides.
   * @returns {void}
   */
  static buildJob(ctx, overrides = {}) {
    const { rawBody, parser, parserRegistry, jobRegistry } = ctx;

    ctx.job = ExtractionJobFactory.build({ rawBody, parser, parserRegistry, jobRegistry, ...overrides });
  }

  /**
   * Stubs the parser implementation to return the given items and performs
   * the context job.
   * @param {object} ctx The spec context.
   * @param {Array<object>} items Items returned by the parser.
   * @returns {Promise<void>} Resolves once the job has performed.
   */
  static async performWith(ctx, items) {
    ctx.parserImpl.extract.and.returnValue(items);
    await ctx.job.perform(ctx.logContext);
  }

  /**
   * Performs the context job, swallowing failures.
   * @param {object} ctx The spec context.
   * @returns {Promise<void>} Resolves once the attempt has run.
   */
  static performIgnoringFailure(ctx) {
    return ctx.job.perform(ctx.logContext).catch(() => {});
  }

  /**
   * Asserts that an Emit job was enqueued for the given item.
   * @param {object} ctx The spec context.
   * @param {object} item The extracted item.
   * @param {?string} [extractionId] Expected extraction id.
   * @returns {void}
   */
  static expectEmitEnqueued(ctx, item, extractionId = null) {
    expect(ctx.jobRegistry.enqueue).toHaveBeenCalledWith('Emit', {
      item, emit, parameters: ExtractionJobSpecUtils.parameters, extractionId,
    });
  }
}

export { ExtractionJobSpecUtils };
