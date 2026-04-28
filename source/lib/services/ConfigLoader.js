import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { ConfigParser } from './ConfigParser.js';
import { ConfigurationFileNotFound } from '../exceptions/ConfigurationFileNotFound.js';
import { EnvResolver } from '../utils/EnvResolver.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * ConfigLoader loads a YAML configuration file and delegates parsing to ConfigParser.
 * @author darthjee
 */
class ConfigLoader {
  /**
   * @param {string} filePath Path to the YAML configuration file.
   */
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Creates a mapped resource object from a YAML file.
   *
   * The YAML must contain a top-level `resources` key.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {{
   * resources: Record<string, Resource>,
   * clients: Record<string, Client>,
   * workers: WorkersConfig
   * }} Mapped resources and clients by name. and workers configuration.
   * @throws {MissingTopLevelConfigKey} Throws when the file is invalid or does not contain required keys.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   */
  static fromFile(filePath) {
    return new ConfigLoader(filePath).load();
  }

  /**
   * Reads and parses the YAML configuration file, then delegates to ConfigParser.
   * @returns {{
   * resources: Record<string, Resource>,
   * clients: Record<string, Client>,
   * workersConfig: WorkersConfig
   * }} Mapped resources and clients by name. and workers configuration.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @throws {MissingTopLevelConfigKey} Throws when the file is invalid or does not contain required keys.
   */
  load() {
    return ConfigParser.fromObject(this.#parseYaml());
  }

  /**
   * Reads and parses the raw YAML file content into a plain object.
   * @returns {object} The raw parsed YAML object.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   */
  #parseYaml() {
    return YAML.parse(EnvResolver.resolveString(this.#yamlContent()));
  }

  /**
   * Reads the YAML configuration file content.
   * @returns {string} The content of the YAML file as a string.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   */
  #yamlContent() {
    try {
      return readFileSync(this.filePath, 'utf8');
    } catch (err) {
      Logger.error(`Configuration file not found: ${this.filePath}`);
      throw new ConfigurationFileNotFound(this.filePath);
    }
  }
}

export { ConfigLoader };