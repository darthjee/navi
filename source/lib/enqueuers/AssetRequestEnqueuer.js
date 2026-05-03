import { Application } from '../services/Application.js';
import { HtmlParser } from '../utils/HtmlParser.js';

/**
 * AssetRequestEnqueuer processes a single AssetRequest against a raw HTML body:
 * it parses matching URLs, resolves them to absolute form, and enqueues one
 * AssetDownloadJob per discovered URL.
 * @author darthjee
 */
class AssetRequestEnqueuer {
  #rawHtml;
  #assetRequest;
  #jobRegistry;
  #clientRegistry;

  /**
   * @param {string} rawHtml The raw HTML response body.
   * @param {AssetRequest} assetRequest The asset extraction rule.
   * @param {object} jobRegistry The job registry used to enqueue AssetDownloadJobs.
   * @param {object} clientRegistry The client registry used for URL resolution.
   */
  constructor(rawHtml, assetRequest, jobRegistry, clientRegistry) {
    this.#rawHtml = rawHtml;
    this.#assetRequest = assetRequest;
    this.#jobRegistry = jobRegistry;
    this.#clientRegistry = clientRegistry;
  }

  /**
   * Parses the HTML body for URLs matching the asset request rule, resolves each URL
   * to absolute form, and enqueues one AssetDownloadJob per URL.
   * Does nothing if the application is in 'stopped' status.
   * @param {LogContext} logContext Context carrying workerId/jobId for log entries.
   * @returns {void}
   */
  enqueue(logContext) {
    if (Application.isStopped()) return;
    const urls = HtmlParser.parse(this.#rawHtml, this.#assetRequest.selector, this.#assetRequest.attribute, logContext);
    for (const url of urls) {
      this.#jobRegistry.enqueue('AssetDownload', {
        url: this.#resolveUrl(url),
        client: this.#assetRequest.client,
        status: this.#assetRequest.status,
      });
    }
  }

  /**
   * Resolves a discovered URL to an absolute URL.
   *
   * | Form | Resolution |
   * |------|------------|
   * | Absolute (`https://…` or `http://…`) | Used as-is. |
   * | Protocol-relative (`//…`) | Prepended with `https:`. |
   * | Root-relative (`/…`) | Concatenated with the named client's `baseUrl`. |
   * @param {string} url The raw URL extracted from the HTML element attribute.
   * @returns {string} The fully-resolved absolute URL.
   * @private
   */
  #resolveUrl(url) {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    const client = this.#clientRegistry.getClient(this.#assetRequest.client);
    return `${client.baseUrl}${url}`;
  }
}

export { AssetRequestEnqueuer };
