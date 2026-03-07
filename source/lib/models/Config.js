import { ConfigLoader } from '../service/configLoader.js';

/**
 * Config is a class that represents the configuration for the application.
 * It includes the resources and clients that are to be included in the configuration.
 * @author darthjee
 */
class Config {
  /**
   * @param {object} attributes The parameters for creating a Config instance.
   * @param {object} attributes.resources The resources to be included in the configuration.
   * @param {object} attributes.clients The clients to be included in the configuration.
   */
  constructor(attributes) {
    this.resources = attributes.resources;
    this.clients = attributes.clients;
  }

  /**
   * Creates a Config instance from a YAML file.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {Config} A new Config instance.
   */
  static fromFile(filePath) {
    return new Config( ConfigLoader.fromFile(filePath) );
  }
}

export { Config };