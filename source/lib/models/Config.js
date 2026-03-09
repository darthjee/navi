import { ConfigLoader } from '../service/configLoader.js';
import { ClientNotFound } from '../exceptions/ClientNotFound.js';

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
   * Returns the resource identified by the given name.
   *
   * @param {string} name The name of the resource to retrieve.
   * @returns {Resource} The matching Resource instance.
   * @throws {Error} Throws when no resource with the given name exists.
   */
  getResource(name) {
    if (!(name in this.resources)) {
      throw new Error(`Resource "${name}" not found.`);
    }
    return this.resources[name];
  }

  /**
   * Returns the client identified by the given name.
   *
   * When `name` is `"default"` or not provided, the method first tries to
   * return the client registered under the `"default"` key.  If no such
   * client exists but exactly one client is registered (under any name),
   * that single client is returned instead.
   *
   * @param {string} [name] The name of the client to retrieve.
   * @returns {Client} The matching Client instance.
   * @throws {ClientNotFound} Throws when the named or default client is not found.
   */
  getClient(name) {
    return this.#fetchClient(name) || this.#getDefaultClient();
  }

  #getDefaultClient() {
    return this.#fetchDefaultClient() || this.#fetchClient('default') || this.#clientNotFound('default');
  }

  #fetchClient(name) {
    if (name in this.clients) {
      return this.clients[name];
    }

    if (name && name !== 'default') {
      this.#clientNotFound(name);
    }
  }

  #clientNotFound(name) {
    throw new ClientNotFound(name);
  }

  #fetchDefaultClient() {
    const clientValues = Object.values(this.clients);

    if (clientValues.length === 1) {
      return clientValues[0];
    }
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