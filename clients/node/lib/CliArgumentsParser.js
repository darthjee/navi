import { parseArgs } from 'node:util';

const ARGUMENTS_CONFIG = {
  options: {
    'base-url': { type: 'string', short: 'b' },
    token: { type: 'string', short: 't' },
    action: { type: 'string', short: 'a' },
    payload: { type: 'string', short: 'p' },
  },
  allowPositionals: false,
};

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
   *
   * @param {string[]} args Command line arguments (typically `process.argv.slice(2)`).
   * @returns {{baseUrl: string, token: string, action: string, payload: string}} Parsed options object.
   */
  static parse(args) {
    const { values } = parseArgs({ args, ...ARGUMENTS_CONFIG });

    return {
      baseUrl: values['base-url'],
      token: values.token,
      action: values.action,
      payload: values.payload,
    };
  }
}

export { CliArgumentsParser };
