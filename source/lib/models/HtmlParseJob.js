import { Job } from './Job.js';
import { HtmlParser } from '../utils/HtmlParser.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * HtmlParseJob is a Job that parses an HTML response body, extracts asset URLs using
 * CSS selectors, and enqueues one AssetDownloadJob per discovered URL.
 *
 * Unlike ResourceRequestJob, this job is exhausted after the first failure — it has no
 * retry rights, analogous to ActionProcessingJob.
 * @author darthjee
 */
class HtmlParseJob extends Job {
  #rawHtml;
  #assetRequests;
  #jobRegistry;
  #clientRegistry;

  /**
   * Creates a new HtmlParseJob instance.
   * @param {object} params - The parameters for creating an HtmlParseJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {string} params.rawHtml - The raw HTML response body string.
   * @param {Array} params.assetRequests - List of AssetRequest instances.
   * @param {object} params.jobRegistry - The job registry used to enqueue AssetDownloadJobs.
   * @param {object} params.clientRegistry - The client registry used for URL resolution.
   */
  constructor({ id, rawHtml, assetRequests, jobRegistry, clientRegistry }) {
    super({ id });
    this.#rawHtml = rawHtml;
    this.#assetRequests = assetRequests;
    this.#jobRegistry = jobRegistry;
    this.#clientRegistry = clientRegistry;
  }

  /**
   * Parses the HTML body, resolves asset URLs, and enqueues one AssetDownloadJob per URL.
   * @returns {Promise<void>}
   */
  async perform() {
    Logger.info(`HtmlParseJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      for (const assetRequest of this.#assetRequests) {
        const urls = HtmlParser.parse(this.#rawHtml, assetRequest.selector, assetRequest.attribute);
        for (const url of urls) {
          const resolvedUrl = this.#resolveUrl(url, assetRequest.client);
          this.#jobRegistry.enqueue('AssetDownload', {
            url: resolvedUrl,
            client: assetRequest.client,
            status: assetRequest.status,
          });
        }
      }
    } catch (error) {
      this._fail(error);
    }
  }

  /**
   * Returns true after the first failed attempt — HtmlParseJob has no retry rights.
   * @returns {boolean} True if the job has failed at least once.
   * @override
   */
  exhausted() {
    return this._attempts >= 1;
  }

  /**
   * Resolves the discovered URL to an absolute URL.
   *
   * | Form | Resolution |
   * |------|------------|
   * | Absolute (`https://…`) | Used as-is. |
   * | Protocol-relative (`//…`) | Prepended with `https:`. |
   * | Root-relative (`/…`) | Concatenated with the named client's `baseUrl`. |
   * @param {string} url The raw URL extracted from the HTML element attribute.
   * @param {string} [clientName] The name of the client, used to look up `baseUrl`.
   * @returns {string} The fully-resolved absolute URL.
   * @private
   */
  #resolveUrl(url, clientName) {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    const client = this.#clientRegistry.getClient(clientName);
    return `${client.baseUrl}${url}`;
  }
}

export { HtmlParseJob };
