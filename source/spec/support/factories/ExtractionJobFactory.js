import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { ResourceRequestParser } from '../../../lib/models/request/resource_request/ResourceRequestParser.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';

/**
 * Factory for creating ExtractionJob instances in tests.
 */
class ExtractionJobFactory {
  /**
   * Builds an ExtractionJob instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.id='test-id'] - The job ID.
   * @param {string} [params.rawBody='price: $42.50 total'] - The raw HTTP response body.
   * @param {ResourceRequestParser} [params.parser] - The parser rule. Defaults to a regex parser
   * matching a price and exposing it as `price`.
   * @param {ParserRegistry} [params.parserRegistry] - The parser registry. Defaults to a
   * ParserRegistry whose `regex` implementation is a spy.
   * @param {object} [params.jobRegistry] - The job registry. Defaults to a spy with an `enqueue` method.
   * @param {ResourceRequestEmit} [params.emit] - The emit configuration. Defaults to `undefined`.
   * @param {object} [params.parameters] - The resource-request parameters. Defaults to `undefined`.
   * @param {string|null} [params.originUrl] - The URL of the originating job. Defaults to the
   * ExtractionJob constructor default (`null`).
   * @returns {ExtractionJob} A new ExtractionJob instance.
   */
  static build({
    id = 'test-id',
    rawBody = 'price: $42.50 total',
    parser = new ResourceRequestParser({ type: 'regex', match: '\\$(\\d+\\.\\d+)', field: 'price' }),
    parserRegistry = new ParserRegistry({ regex: jasmine.createSpyObj('parserImpl', ['extract']) }),
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']),
    emit,
    parameters,
    originUrl,
  } = {}) {
    return new ExtractionJob({ id, rawBody, parser, parserRegistry, jobRegistry, emit, parameters, originUrl });
  }
}

export { ExtractionJobFactory };
