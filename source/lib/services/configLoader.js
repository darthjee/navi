import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { ConfigParser } from './configParser.js';

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
   * @returns {{resources: Record<string, Resource>, clients: Record<string, Client>}} Mapped resources and clients by name.
   * @throws {Error} Throws when the file is invalid or does not contain required keys.
   */
  static fromFile(filePath) {
    return new ConfigLoader(filePath).load();
  }

  /**
   * Reads and parses the YAML configuration file, then delegates to ConfigParser.
   * @returns {{resources: Record<string, Resource>, clients: Record<string, Client>}} Mapped resources and clients by name.
   */
  load() {
    return ConfigParser.fromObject(this.#parseYaml());
  }

  /**
   * Reads and parses the raw YAML file content into a plain object.
   * @returns {object} The raw parsed YAML object.
   */
  #parseYaml() {
    return YAML.parse(this.#yamlContent());
  }

  /**
   * Reads the YAML configuration file content.
   * @returns {string} The content of the YAML file as a string.
   */
  #yamlContent() {
    return readFileSync(this.filePath, 'utf8');
  }
}

export { ConfigLoader };