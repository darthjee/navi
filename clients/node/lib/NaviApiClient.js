import axios from 'axios';
import { Logger } from 'deku-sprout';
import { ApiRequestFailed } from './exceptions/ApiRequestFailed.js';

/**
 * Maximum length of the raw response body echoed in an `ApiRequestFailed`
 * message (does not apply to a string `body.error`).
 */
const MAX_REASON_LENGTH = 200;

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
   * @throws {ApiRequestFailed} If the request fails, or the response status is >= 400
   *   (in which case the message carries the server's reason: `body.error` when it is
   *   a string, otherwise the raw body truncated to 200 characters).
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
        `Request to ${url} failed with status ${response.status}${this.#failureReason(response.data)}`,
        { statusCode: response.status, url, body: response.data },
      );
    }

    return response.data;
  }

  /**
   * Builds the `": <reason>"` suffix for an error response's message.
   *
   * @param {*} data The parsed response body.
   * @returns {string} The suffix, or `''` when the body carries nothing to report.
   */
  #failureReason(data) {
    if (this.#isEmptyBody(data)) {
      return '';
    }

    if (typeof data === 'object' && typeof data.error === 'string') {
      return `: ${data.error}`;
    }

    const raw = typeof data === 'string' ? data : JSON.stringify(data);

    return `: ${this.#truncate(raw)}`;
  }

  /**
   * @param {*} data The parsed response body.
   * @returns {boolean} Whether the body is `undefined`, `null`, `''`, `{}` or `[]`.
   */
  #isEmptyBody(data) {
    if (data === undefined || data === null || data === '') {
      return true;
    }

    return typeof data === 'object' && Object.keys(data).length === 0;
  }

  /**
   * @param {string} text The text to shorten.
   * @returns {string} The text, cut to `MAX_REASON_LENGTH` characters plus `…` when longer.
   */
  #truncate(text) {
    if (text.length <= MAX_REASON_LENGTH) {
      return text;
    }

    return `${text.slice(0, MAX_REASON_LENGTH)}…`;
  }
}

export { NaviApiClient };
