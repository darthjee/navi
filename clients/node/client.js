import { NaviApiClient } from './lib/NaviApiClient.js';

/**
 * NaviClient is a thin wrapper over a running Navi instance's token-secured
 * `/api/*` HTTP namespace: `POST /api/config`, `POST /api/engine/start`,
 * and `POST /api/engine/stop`.
 *
 * It performs no client-side config/resource logic — every call is a direct
 * pass-through to the corresponding `/api/*` route, with the `Authorization: Bearer <token>`
 * header handled internally.
 *
 * @author darthjee
 */
class NaviClient {
  /**
   * @param {object} attributes NaviClient attributes.
   * @param {string} attributes.baseUrl Base URL of the running Navi instance (no trailing slash required).
   * @param {string} attributes.token Bearer token matching the target instance's `web.api.token`.
   * @param {number} [attributes.timeout=5000] Request timeout in milliseconds.
   */
  constructor({ baseUrl, token, timeout = 5000 }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.timeout = timeout;
    this.apiClient = new NaviApiClient({ baseUrl, token, timeout });
  }

  /**
   * Calls `POST /api/config`, merging a namespace's `resources`/`clients`
   * into the running instance.
   *
   * @param {object} payload The request body (`namespace`, `resources`, `clients`).
   * @returns {Promise<object>} The parsed JSON response body (e.g. `{ status: 'accepted' }`).
   * @throws {ApiRequestFailed} If the request fails or the response status is >= 400.
   */
  async config(payload) {
    return this.apiClient.post('/api/config', payload);
  }

  /**
   * Calls `POST /api/engine/start`, starting or pushing resources into the
   * running instance, scoped per namespace via `targets`.
   *
   * @param {object} [payload={}] The request body (`targets`), or `{}` to
   * fall back to the instance's default-namespace behavior.
   * @returns {Promise<object>} The parsed JSON response body (`status`, `enqueued`, `skippedResources`).
   * @throws {ApiRequestFailed} If the request fails or the response status is >= 400.
   */
  async engineStart(payload = {}) {
    return this.apiClient.post('/api/engine/start', payload);
  }

  /**
   * Calls `POST /api/engine/stop`, stopping the running instance's engine.
   *
   * @returns {Promise<object>} The parsed JSON response body.
   * @throws {ApiRequestFailed} If the request fails or the response status is >= 400.
   */
  async engineStop() {
    return this.apiClient.post('/api/engine/stop');
  }
}

export { NaviClient };
