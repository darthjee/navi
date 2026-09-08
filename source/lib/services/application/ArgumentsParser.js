const DEFAULT_CONFIG_FILE = 'config/navi_config.yml';
const DEFAULT_MENU_FILE = 'config/menu.yml';
const ARGUMENTS_CONFIG = {
  options: {
    config: { type: 'string', short: 'c', default: DEFAULT_CONFIG_FILE },
    menu: { type: 'string', short: 'm', default: DEFAULT_MENU_FILE },
  },
  allowPositionals: false,
};

import { parseArgs } from 'node:util';

/**
 * Parses CLI arguments and returns a structured options object.
 * @author darthjee
 */
class ArgumentsParser {
  /**
   * Parses command line arguments to extract CLI options.
   *
   * Supports:
   *   -c <path>        Short form with a space-separated value
   *   --config=<path>  Long form with an equals sign
   *   -m <path>        Short form with a space-separated value
   *   --menu=<path>    Long form with an equals sign
   *
   * Falls back to DEFAULT_CONFIG_FILE / DEFAULT_MENU_FILE when the matching
   * option is not provided.
   *
   * @param {string[]} args - Command line arguments (typically process.argv.slice(2))
   * @returns {{ configFile: string, menuFile: string }} Parsed options object with
   *   the config file path and the menu file path.
   */
  static parse(args) {
    return parseArgs({
      args: args,
      ...ARGUMENTS_CONFIG
    }).values;
  }
}

export { ArgumentsParser, DEFAULT_CONFIG_FILE, DEFAULT_MENU_FILE };
