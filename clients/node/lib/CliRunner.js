import { NaviClient } from '../client.js';
import { ConfigFileGrouper } from './ConfigFileGrouper.js';
import { Logger } from './logging/Logger.js';

const ACTIONS = ['config', 'engine-start', 'engine-stop'];
const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'];

/**
 * CliRunner drives the `navi-client` CLI: validates the parsed arguments,
 * dispatches to the matching `NaviClient` method, and prints the result.
 *
 * @author darthjee
 */
class CliRunner {
  /**
   * Runs the CLI for the given parsed options, printing the JSON result to
   * stdout on success or the error message to stderr on failure.
   *
   * @param {object} options Parsed CLI options (see `CliArgumentsParser.parse`).
   * @param {string} options.baseUrl Base URL of the running Navi instance.
   * @param {string} options.token Bearer token.
   * @param {string} options.action One of `config`, `engine-start`, `engine-stop`.
   * @param {string} [options.payload] Optional JSON request body.
   * @param {Array<{path: string, mode: 'json'|'yaml'|'auto'}>} [options.configFiles] Optional
   * ordered `--file`/`--json`/`--yaml` list (`config` action only), mutually exclusive with `payload`.
   * @param {string} [options.logLevel] Optional `--log-level` value. One of `debug`/`info`/`warn`/
   * `error`/`silent`. Takes precedence over the `LOG_LEVEL` env var when given.
   * @returns {Promise<number>} The process exit code (`0` on success, `1` on failure).
   */
  static async run({ baseUrl, token, action, payload, configFiles = [], logLevel }) {
    const validationError = CliRunner.#validate({ baseUrl, token, action, payload, configFiles, logLevel });
    if (validationError) {
      Logger.error(validationError);
      return 1;
    }

    if (logLevel) Logger.setLevel(logLevel);

    let body;
    try {
      body = payload ? JSON.parse(payload) : undefined;
    } catch (error) {
      Logger.error(`Invalid JSON payload: ${error.message}`);
      return 1;
    }

    const client = new NaviClient({ baseUrl, token });

    try {
      const result = await CliRunner.#dispatch(client, action, body, configFiles);
      console.log(JSON.stringify(result, null, 2));
      return 0;
    } catch (error) {
      Logger.error(error.message);
      return 1;
    }
  }

  /**
   * Dispatches to the `NaviClient` method matching the given action.
   *
   * @param {NaviClient} client The client instance to call.
   * @param {string} action One of `config`, `engine-start`, `engine-stop`.
   * @param {object} [body] The parsed request body, when given.
   * @param {Array<{path: string, mode: 'json'|'yaml'|'auto'}>} [configFiles] The ordered
   * `--file`/`--json`/`--yaml` list, when given (`config` action only).
   * @returns {Promise<*>} The result of the underlying `NaviClient` call.
   */
  static async #dispatch(client, action, body, configFiles) {
    if (action === 'config' && configFiles.length > 0) {
      return CliRunner.#configFromEntries(client, configFiles);
    }

    switch (action) {
      case 'config':
        return client.config(body);
      case 'engine-start':
        return client.engineStart(body);
      case 'engine-stop':
        return client.engineStop();
    }
  }

  /**
   * Groups the given ordered config file entries by namespace (fail-fast — see
   * `ConfigFileGrouper`) and issues one `POST /api/config` call per group,
   * sequentially, in fan-out order. Entries may mix forced/auto-detected modes
   * (e.g. combined `--file`/`--json`/`--yaml`), which is why this bypasses
   * `NaviClient#configFromFiles`/`#configFromJson`/`#configFromYaml` — those
   * assume a single uniform mode for the whole call.
   *
   * @param {NaviClient} client The client instance to call.
   * @param {Array<{path: string, mode: 'json'|'yaml'|'auto'}>} configFiles The ordered
   * `--file`/`--json`/`--yaml` list.
   * @returns {Promise<object[]>} One `POST /api/config` response per distinct namespace.
   * @private
   */
  static async #configFromEntries(client, configFiles) {
    const groups = ConfigFileGrouper.group(configFiles);

    const results = [];
    for (const group of groups) {
      results.push(await client.config(group));
    }

    return results;
  }

  /**
   * Validates the required CLI options.
   *
   * @param {object} options
   * @param {string} options.baseUrl
   * @param {string} options.token
   * @param {string} options.action
   * @param {string} [options.payload]
   * @param {Array} [options.configFiles]
   * @param {string} [options.logLevel]
   * @returns {string|null} An error message, or `null` when the options are valid.
   */
  static #validate({ baseUrl, token, action, payload, configFiles, logLevel }) {
    if (!baseUrl) return 'Missing required option: --base-url';
    if (!token) return 'Missing required option: --token';
    if (!action) return 'Missing required option: --action';
    if (!ACTIONS.includes(action)) return `Invalid --action "${action}". Must be one of: ${ACTIONS.join(', ')}`;
    if (payload && configFiles.length > 0) {
      return '--payload cannot be combined with --file/--json/--yaml';
    }
    if (logLevel && !LOG_LEVELS.includes(logLevel)) {
      return `Invalid --log-level "${logLevel}". Must be one of: ${LOG_LEVELS.join(', ')}`;
    }

    return null;
  }
}

export { CliRunner };
