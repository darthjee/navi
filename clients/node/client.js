import { ConfigFileGrouper } from './lib/ConfigFileGrouper.js';
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
   * Parses one or more JSON config files (same `namespace`/`resources`/`clients`
   * shape the engine reads; every other top-level key, including `include`, is
   * ignored — no `include:` chain is followed) and calls `POST /api/config` once
   * per distinct namespace, sequentially, in order of first appearance.
   *
   * Every given file is parsed up front: if any file is missing or fails to
   * parse, the call throws before any request is sent.
   *
   * @param {string|string[]} paths A single file path, or an array of file paths.
   * @returns {Promise<object[]>} One `POST /api/config` response per distinct
   * namespace, in fan-out order.
   * @throws {ConfigFileParseError} If any given file cannot be read or parsed.
   * @throws {ApiRequestFailed} If any request fails or its response status is >= 400.
   */
  async configFromJson(paths) {
    return this.#configFromPaths(paths, 'json');
  }

  /**
   * Same as {@link NaviClient#configFromJson}, but parses every given file as YAML,
   * regardless of its extension.
   *
   * @param {string|string[]} paths A single file path, or an array of file paths.
   * @returns {Promise<object[]>} One `POST /api/config` response per distinct
   * namespace, in fan-out order.
   * @throws {ConfigFileParseError} If any given file cannot be read or parsed.
   * @throws {ApiRequestFailed} If any request fails or its response status is >= 400.
   */
  async configFromYaml(paths) {
    return this.#configFromPaths(paths, 'yaml');
  }

  /**
   * Same as {@link NaviClient#configFromJson}, but auto-detects each file's parser
   * from its extension (`.json` → JSON, `.yml`/`.yaml` → YAML).
   *
   * @param {string|string[]} paths A single file path, or an array of file paths.
   * @returns {Promise<object[]>} One `POST /api/config` response per distinct
   * namespace, in fan-out order.
   * @throws {ConfigFileParseError} If any given file cannot be read or parsed.
   * @throws {ApiRequestFailed} If any request fails or its response status is >= 400.
   */
  async configFromFiles(paths) {
    return this.#configFromPaths(paths, 'auto');
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

  /**
   * Shared implementation behind `configFromJson`/`configFromYaml`/`configFromFiles`:
   * normalizes `paths` to an array, parses and groups every file by namespace
   * (fail-fast — see `ConfigFileGrouper`), then issues one `POST /api/config`
   * call per namespace group, sequentially, in fan-out order.
   *
   * @param {string|string[]} paths A single file path, or an array of file paths.
   * @param {'json'|'yaml'|'auto'} mode The parser to use for every given file.
   * @returns {Promise<object[]>} One `POST /api/config` response per distinct
   * namespace, in fan-out order.
   * @throws {ConfigFileParseError} If any given file cannot be read or parsed.
   * @throws {ApiRequestFailed} If any request fails or its response status is >= 400.
   * @private
   */
  async #configFromPaths(paths, mode) {
    const entries = [].concat(paths).map((path) => { return { path, mode }; });
    const groups = ConfigFileGrouper.group(entries);

    const results = [];
    for (const group of groups) {
      results.push(await this.config(group));
    }

    return results;
  }
}

export { NaviClient };
