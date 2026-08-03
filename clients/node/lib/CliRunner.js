import { NaviClient } from '../client.js';

const ACTIONS = ['config', 'engine-start', 'engine-stop'];

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
   * @returns {Promise<number>} The process exit code (`0` on success, `1` on failure).
   */
  static async run({ baseUrl, token, action, payload }) {
    const validationError = CliRunner.#validate({ baseUrl, token, action });
    if (validationError) {
      console.error(validationError);
      return 1;
    }

    let body;
    try {
      body = payload ? JSON.parse(payload) : undefined;
    } catch (error) {
      console.error(`Invalid JSON payload: ${error.message}`);
      return 1;
    }

    const client = new NaviClient({ baseUrl, token });

    try {
      const result = await CliRunner.#dispatch(client, action, body);
      console.log(JSON.stringify(result, null, 2));
      return 0;
    } catch (error) {
      console.error(error.message);
      return 1;
    }
  }

  /**
   * Dispatches to the `NaviClient` method matching the given action.
   *
   * @param {NaviClient} client The client instance to call.
   * @param {string} action One of `config`, `engine-start`, `engine-stop`.
   * @param {object} [body] The parsed request body, when given.
   * @returns {Promise<*>} The result of the underlying `NaviClient` call.
   */
  static #dispatch(client, action, body) {
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
   * Validates the required CLI options.
   *
   * @param {object} options
   * @param {string} options.baseUrl
   * @param {string} options.token
   * @param {string} options.action
   * @returns {string|null} An error message, or `null` when the options are valid.
   */
  static #validate({ baseUrl, token, action }) {
    if (!baseUrl) return 'Missing required option: --base-url';
    if (!token) return 'Missing required option: --token';
    if (!action) return 'Missing required option: --action';
    if (!ACTIONS.includes(action)) return `Invalid --action "${action}". Must be one of: ${ACTIONS.join(', ')}`;

    return null;
  }
}

export { CliRunner };
