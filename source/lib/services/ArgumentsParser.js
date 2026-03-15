const DEFAULT_CONFIG_FILE = 'config/navi_config.yml';

class ArgumentParser {
  constructor(args, index) {
    this.args = args;
    this.index = index;
  }

  static parse(args, index) {
    return (new ArgumentParser(args, index)).parse();
  }

  parse() {
    if (this.args[this.index] === '-c') {
      if (this.index + 1 >= this.args.length || this.args[this.index + 1].startsWith('-')) {
        console.error('Error: -c option requires a config file path');
        process.exit(1);
      }
      return { configFile: this.args[this.index + 1] };
    }

    if (this.args[this.index].startsWith('--config=')) {
      const value = this.args[this.index].slice('--config='.length);
      if (!value) {
        console.error('Error: --config option requires a config file path');
        process.exit(1);
      }
      return { configFile: value };
    }
  }
}

/**
 * Parses CLI arguments and returns a structured options object.
 * @author darthjee
 */
class ArgumentsParser {

  constructor(args) {
    this.args = args;
  }

  parse() {
    for (let index = 0; index < this.args.length; index++) {
      const result = ArgumentParser.parse(this.args, index);
      if (result) {
        return result;
      }
    }

    return { configFile: DEFAULT_CONFIG_FILE };
  }

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
    return (new ArgumentsParser(args)).parse();
  }
}

export { ArgumentsParser, DEFAULT_CONFIG_FILE };
