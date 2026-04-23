import { LogConfig } from './LogConfig.js';
import { ClientRegistry } from '../registry/ClientRegistry.js';
import { ResourceRegistry } from '../registry/ResourceRegistry.js';
import { ConfigLoader } from '../services/ConfigLoader.js';

/**
 * Config is a class that represents the configuration for the application.
 * It includes the resources and clients that are to be included in the configuration.
 * @author darthjee
 */
class Config {
  /**
   * @param {object} params initialization parameters for the Config instance.
   * @param {Record<string, Resource>} params.resources - A mapping of resource names to Resource instances.
   * @param {Record<string, Client>} params.clients - A mapping of client names to Client instances.
   * @param {WorkersConfig} params.workersConfig - The configuration for worker instances.
   * @param {WebConfig|null} [params.webConfig] - Optional web server configuration.
   * @param {LogConfig} [params.logConfig] - Optional log configuration.
   */
  constructor({ resources, clients, workersConfig, webConfig, logConfig }) {
    this.resourceRegistry = ResourceRegistry.build(resources);
    this.clientRegistry = new ClientRegistry(clients);
    this.workersConfig = workersConfig;
    this.webConfig = webConfig ?? null;
    this.logConfig = logConfig ?? new LogConfig();
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
   *
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @throws {MissingTopLevelConfigKey} Throws when the file is invalid or does not contain required keys.
   */
  static fromFile(filePath) {
    return new Config( ConfigLoader.fromFile(filePath) );
  }
}

export { Config };