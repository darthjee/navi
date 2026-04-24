import { Job } from './Job.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * AssetDownloadJob is a Job that fetches a single fully-resolved asset URL and validates
 * the expected HTTP status. It is a leaf node — no further chaining occurs after a
 * successful fetch. Follows the standard retry/dead path on failure.
 * @author darthjee
 */
class AssetDownloadJob extends Job {
  #url;
  #clientName;
  #status;
  #clientRegistry;

  /**
   * Creates a new AssetDownloadJob instance.
   * @param {object} params - The parameters for creating an AssetDownloadJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {string} params.url - The fully-resolved asset URL to fetch.
   * @param {string} [params.client] - Named client to use (defaults to `'default'`).
   * @param {number} params.status - Expected HTTP status code.
   * @param {object} params.clientRegistry - The client registry used to look up the client.
   */
  constructor({ id, url, client, status, clientRegistry }) {
    super({ id });
    this.#url = url;
    this.#clientName = client;
    this.#status = status;
    this.#clientRegistry = clientRegistry;
  }

  /**
   * Fetches the asset URL using the named client and validates the HTTP status.
   * @returns {Promise<object>} The HTTP response.
   */
  async perform() {
    Logger.info(`AssetDownloadJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      const client = this.#clientRegistry.getClient(this.#clientName);
      return await client.performUrl(this.#url, this.#status);
    } catch (error) {
      Logger.error(`AssetDownloadJob #${this.id} failed: ${error}`);
      this._fail(error);
    }
  }
}

export { AssetDownloadJob };
