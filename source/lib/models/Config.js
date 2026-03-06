import { ConfigLoader } from '../service/configLoader.js';

/**
 * Config is a class that represents the configuration for the application.
 * It includes the resources that are to be included in the configuration.
 * @author darthjee
 */
class Config {
  /**
   * @param {object} attributes The parameters for creating a Config instance.
   * @param {object} attributes.resources The resources to be included in the configuration.
   */
  constructor(attributes) {
    this.resources = attributes.resources;
  }

  /**
   * Creates a Config instance from a YAML file.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {Config} A new Config instance.
   */
  static fromFile(filePath) {
    return new Config({ resources: ConfigLoader.fromFile(filePath) });
  }
}

export { Config };