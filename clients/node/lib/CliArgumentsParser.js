import { parseArgs } from 'node:util';

const ARGUMENTS_CONFIG = {
  options: {
    'base-url': { type: 'string', short: 'b' },
    token: { type: 'string', short: 't' },
    action: { type: 'string', short: 'a' },
    payload: { type: 'string', short: 'p' },
    file: { type: 'string', multiple: true },
    json: { type: 'string', multiple: true },
    yaml: { type: 'string', multiple: true },
    'log-level': { type: 'string' },
  },
  allowPositionals: false,
};

const CONFIG_FILE_MODES = { file: 'auto', json: 'json', yaml: 'yaml' };

/**
 * Parses CLI arguments for the `navi-client` command.
 *
 * @author darthjee
 */
class CliArgumentsParser {
  /**
   * Parses command line arguments to extract CLI options.
   *
   * Supports:
   *   --base-url <url>, -b <url>       Base URL of the running Navi instance
   *   --token <token>, -t <token>      Bearer token
   *   --action <action>, -a <action>   One of: config, engine-start, engine-stop
   *   --payload <json>, -p <json>      Optional JSON request body
   *   --file <path>                    Repeatable; config file, parser auto-detected by extension
   *   --json <path>                    Repeatable; config file, forced JSON parsing
   *   --yaml <path>                    Repeatable; config file, forced YAML parsing
   *   --log-level <level>              One of: debug, info, warn, error, silent. Defaults to
   *                                    the LOG_LEVEL env var, or 'info'. Takes precedence
   *                                    over LOG_LEVEL when both are given.
   *
   * `--file`/`--json`/`--yaml` are freely combinable and repeatable; the resulting
   * `configFiles` list preserves their literal command-line order across all three flags.
   *
   * @param {string[]} args Command line arguments (typically `process.argv.slice(2)`).
   * @returns {{
   * baseUrl: string, token: string, action: string, payload: string,
   * configFiles: Array<{path: string, mode: 'json'|'yaml'|'auto'}>, logLevel: string
   * }} Parsed options object.
   */
  static parse(args) {
    const { values, tokens } = parseArgs({ args, ...ARGUMENTS_CONFIG, tokens: true });

    return {
      baseUrl: values['base-url'],
      token: values.token,
      action: values.action,
      payload: values.payload,
      configFiles: CliArgumentsParser.#configFiles(tokens),
      logLevel: values['log-level'],
    };
  }

  /**
   * Reconstructs the ordered `--file`/`--json`/`--yaml` list from the raw parsed
   * tokens, preserving their literal command-line order across the three option names.
   *
   * @param {Array<object>} tokens The `tokens` array returned by `node:util`'s `parseArgs`.
   * @returns {Array<{path: string, mode: 'json'|'yaml'|'auto'}>} The ordered config file list.
   * @private
   */
  static #configFiles(tokens) {
    return tokens
      .filter((token) => { return token.kind === 'option' && token.name in CONFIG_FILE_MODES; })
      .map((token) => { return { path: token.value, mode: CONFIG_FILE_MODES[token.name] }; });
  }
}

export { CliArgumentsParser };
