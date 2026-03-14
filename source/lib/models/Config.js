import { ConfigLoader } from '../services/configLoader.js';
import { ClientRegistry } from '../registry/ClientRegistry.js';
import { ResourceRegistry } from './ResourceRegistry.js';

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
    this.resourceRegistry = new ResourceRegistry(attributes.resources);
    this.clientRegistry = new ClientRegistry(attributes.clients);
  }

  /**
   * Returns the resource identified by the given name.
   *
   * @param {string} name The name of the resource to retrieve.
   * @returns {Resource} The matching Resource instance.
   * @throws {Error} Throws when no resource with the given name exists.
   */
  getResource(name) {
    return this.resourceRegistry.getItem(name);
  }

  /**
   * Returns the client identified by the given name.
   *
   * When `name` is `"default"` or not provided, the method first tries to
   * return the client registered under the `"default"` key.  If no such
   * client exists but exactly one client is registered (under any name),
   * that single client is returned instead.
   *
   * @see ClientRegistry#getClient for the client retrieval logic.
   * 
   * @param {string} [name] The name of the client to retrieve.
   * @returns {Client} The matching Client instance.
   * @throws {ClientNotFound} Throws when the named or default client is not found.
   */
  getClient(name) {
    return this.clientRegistry.getClient(name);
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