import { AssetRequestEnqueuer } from './AssetRequestEnqueuer.js';
import { Job } from './Job.js';
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
   * Returns the job-specific arguments for serialization.
   * @returns {{ assetCount: number }} The job arguments.
   */
  get arguments() {
    return { assetCount: this.#assetRequests.length };
  }

  /**
   * Returns the maximum number of retries for this job type.
   * HtmlParseJob is exhausted after the first failure.
   * @returns {number} Always 1.
   * @override
   */
  get maxRetries() {
    return 1;
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
        new AssetRequestEnqueuer(this.#rawHtml, assetRequest, this.#jobRegistry, this.#clientRegistry).enqueue();
      }
    } catch (error) {
      this._fail(error);
    }
  }
}

export { HtmlParseJob };
