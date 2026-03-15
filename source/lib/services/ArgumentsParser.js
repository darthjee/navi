const DEFAULT_CONFIG_FILE = 'config/navi_config.yml';

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
   *
   * Falls back to DEFAULT_CONFIG_FILE when no option is provided.
   *
   * @param {string[]} args - Command line arguments (typically process.argv.slice(2))
   * @returns {{ configFile: string }} Parsed options object with the config file path.
   */
  static parse(args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-c') {
        if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
          console.error('Error: -c option requires a config file path');
          process.exit(1);
        }
        return { configFile: args[i + 1] };
      }

      if (args[i].startsWith('--config=')) {
        const value = args[i].slice('--config='.length);
        if (!value) {
          console.error('Error: --config option requires a config file path');
          process.exit(1);
        }
        return { configFile: value };
      }
    }

    return { configFile: DEFAULT_CONFIG_FILE };
  }
}

export { ArgumentsParser, DEFAULT_CONFIG_FILE };
