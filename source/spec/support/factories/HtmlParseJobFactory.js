import { NamespaceMapFactory } from './NamespaceMapFactory.js';
import { HtmlParseJob } from '../../../lib/jobs/HtmlParseJob.js';

/**
 * Factory for creating HtmlParseJob instances in tests.
 */
class HtmlParseJobFactory {
  /**
   * Builds an HtmlParseJob instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.id='test-id'] - The job ID.
   * @param {string} [params.rawHtml='<html></html>'] - The raw HTML response body.
   * @param {Array<AssetRequest>} [params.assetRequests=[]] - The asset requests to extract.
   * @param {object} [params.jobRegistry] - The job registry. Defaults to a spy with an `enqueue` method.
   * @param {NamespaceMap} [params.clientRegistry] - The client registry. Defaults to NamespaceMapFactory.build().
   * @param {string|null} [params.originUrl] - The URL of the originating job. Defaults to the
   * HtmlParseJob constructor default (`null`).
   * @returns {HtmlParseJob} A new HtmlParseJob instance.
   */
  static build({
    id = 'test-id',
    rawHtml = '<html></html>',
    assetRequests = [],
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']),
    clientRegistry = NamespaceMapFactory.build(),
    originUrl,
  } = {}) {
    return new HtmlParseJob({ id, rawHtml, assetRequests, jobRegistry, clientRegistry, originUrl });
  }
}

export { HtmlParseJobFactory };
