import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { EnvStringResolver } from './EnvStringResolver.js';
import { ConfigFileParseError } from './exceptions/ConfigFileParseError.js';

/**
 * ConfigFileParser reads and parses a single JSON/YAML config file (the same
 * `namespace`/`resources`/`clients` shape the engine reads), resolving
 * `$VAR`/`${VAR}` environment variable references locally before parsing.
 *
 * Unlike the engine's `ConfigIncluder`/`ConfigParser`, this is strictly
 * single-file and non-recursive: it never follows an `include:` chain (an
 * `include:` key, like any other top-level key besides `namespace`/`resources`/
 * `clients`, is silently ignored), and it performs no model validation — the
 * raw `resources`/`clients` objects are returned as-is, for the server's
 * existing `POST /api/config` validation to handle.
 *
 * @author darthjee
 */
class ConfigFileParser {
  /**
   * Reads and parses a single config file.
   *
   * @param {string} filePath The file path to read.
   * @param {'json'|'yaml'|'auto'} [mode='auto'] The parser to use. `'auto'`
   * detects it from the file extension (`.json` → JSON, `.yml`/`.yaml` → YAML).
   * @returns {{namespace: string, resources: object, clients: object}} The parsed config.
   * @throws {ConfigFileParseError} If the file cannot be read or fails to parse.
   */
  static parse(filePath, mode = 'auto') {
    return new ConfigFileParser(filePath, mode).parse();
  }

  /**
   * @param {string} filePath The file path to read.
   * @param {'json'|'yaml'|'auto'} [mode='auto'] The parser to use.
   */
  constructor(filePath, mode = 'auto') {
    this.path = filePath;
    this.mode = mode;
  }

  /**
   * Reads and parses the config file.
   *
   * @returns {{namespace: string, resources: object, clients: object}} The parsed config,
   * with `namespace` defaulting to `'default'` and `resources`/`clients` defaulting to `{}`.
   * Every other top-level key (including `include`) is ignored.
   * @throws {ConfigFileParseError} If the file cannot be read or fails to parse.
   */
  parse() {
    const resolved = this.#readResolved();
    const parsed = this.#parseContent(resolved);

    return {
      namespace: parsed?.namespace ?? 'default',
      resources: parsed?.resources ?? {},
      clients:   parsed?.clients ?? {},
    };
  }

  /**
   * Reads the file's raw content and resolves env var references in it.
   *
   * @returns {string} The env-var-resolved file content.
   * @throws {ConfigFileParseError} If the file cannot be read.
   * @private
   */
  #readResolved() {
    let content;

    try {
      content = readFileSync(this.path, 'utf8');
    } catch (error) {
      throw new ConfigFileParseError(
        `Failed to read config file "${this.path}": ${error.message}`,
        { path: this.path, cause: error },
      );
    }

    return EnvStringResolver.resolve(content);
  }

  /**
   * Parses the given resolved content using the effective mode's parser.
   *
   * @param {string} content The env-var-resolved file content.
   * @returns {object} The parsed object.
   * @throws {ConfigFileParseError} If the content fails to parse.
   * @private
   */
  #parseContent(content) {
    try {
      return this.#effectiveMode() === 'json' ? JSON.parse(content) : YAML.parse(content);
    } catch (error) {
      throw new ConfigFileParseError(
        `Failed to parse config file "${this.path}" as ${this.#effectiveMode()}: ${error.message}`,
        { path: this.path, cause: error },
      );
    }
  }

  /**
   * Resolves the effective parsing mode, detecting it from the file extension
   * when `mode` is `'auto'`.
   *
   * @returns {'json'|'yaml'} The effective mode.
   * @private
   */
  #effectiveMode() {
    if (this.mode === 'json' || this.mode === 'yaml') return this.mode;

    return path.extname(this.path).toLowerCase() === '.json' ? 'json' : 'yaml';
  }
}

export { ConfigFileParser };
