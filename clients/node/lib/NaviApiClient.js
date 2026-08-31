import axios from 'axios';
import { ApiRequestFailed } from './exceptions/ApiRequestFailed.js';
import { Logger } from './logging/Logger.js';

/**
 * NaviApiClient performs authenticated POST requests against a running Navi
 * instance's token-secured `/api/*` HTTP namespace.
 *
 * It is an internal implementation detail of `NaviClient` (`client.js`) —
 * consumers of the package should use `NaviClient` instead of this class directly.
 *
 * @author darthjee
 */
class NaviApiClient {
  /**
   * @param {object} attributes NaviApiClient attributes.
   * @param {string} attributes.baseUrl Base URL of the running Navi instance (no trailing slash required).
   * @param {string} attributes.token Bearer token matching the target instance's `web.api.token`.
   * @param {number} [attributes.timeout=5000] Request timeout in milliseconds.
   */
  constructor({ baseUrl, token, timeout = 5000 }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.timeout = timeout;
  }

  /**
   * Performs an authenticated `POST` request against the given `/api/*` path.
   *
   * @param {string} path The `/api/*` path to request (e.g. `/api/config`).
   * @param {object} [body={}] The JSON request body.
   * @returns {Promise<*>} The parsed JSON response body.
   * @throws {ApiRequestFailed} If the request fails, or the response status is >= 400.
   */
  async post(path, body = {}) {
    const url = `${this.baseUrl}${path}`;

    // Never log the axios request/config object as a whole — it carries
    // `headers`, including the `Authorization: Bearer <token>` set below,
    // which must never reach a log line.
    Logger.debug('Outbound request', { method: 'POST', url, body });

    let response;
    try {
      response = await axios.post(url, body, {
        timeout: this.timeout,
        headers: { Authorization: `Bearer ${this.token}` },
        validateStatus: () => true,
      });
    } catch (error) {
      throw new ApiRequestFailed(`Request to ${url} failed: ${error.message}`, { url });
    }

    if (response.status >= 400) {
      throw new ApiRequestFailed(
        `Request to ${url} failed with status ${response.status}`,
        { statusCode: response.status, url, body: response.data },
      );
    }

    return response.data;
  }
}

export { NaviApiClient };
