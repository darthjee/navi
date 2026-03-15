import { Client } from './Client.js';
import { Resource } from '../models/Resource.js';
import { WorkersConfig } from '../models/WorkersConfig.js';

/**
 * ConfigParser receives a parsed YAML configuration object and maps it to
 * Resource and Client model instances.
 * @author darthjee
 */
class ConfigParser {
  /**
   * @param {object} config Parsed configuration object from a YAML file.
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Creates a mapped configuration from a plain parsed YAML object.
   *
   * @param {object} config Parsed configuration object from a YAML file.
   * @returns {{
   * resources: Record<string, Resource>,
   * clients: Record<string, Client>,
   * workersConfig: WorkersConfig
   * }} Mapped resources and clients by name. and workers configuration.
   * @throws {Error} Throws when the config is invalid or missing required keys.
   */
  static fromObject(config) {
    return new ConfigParser(config).parse();
  }

  /**
   * Parses the configuration object and maps resources and clients to model instances.
   * @returns {{
   * resources: Record<string, Resource>,
   * clients: Record<string, Client>,
   * workers: WorkersConfig
   * }} Mapped resources and clients by name. and workers configuration.
   */
  parse() {
    const mappedResources = Object.fromEntries(
      this.#resourcesEntries()
    );

    const mappedClients = Object.fromEntries(
      this.#clientsEntries()
    );

    return {
      resources: mappedResources,
      clients: mappedClients,
      workersConfig: this.#workersConfig()
    };
  }

  #workersConfig() {
    return new WorkersConfig(this.config.workers);
  }

  /**
   * Maps the resources to entries suitable for Object.fromEntries.
   * @returns {Array<Array>} Entries of resource name and Resource instance.
   */
  #resourcesEntries() {
    return this.#loadResources().map((resource) => { return [resource.name, resource]; });
  }

  /**
   * Maps the clients to entries suitable for Object.fromEntries.
   * @returns {Array<Array>} Entries of client name and Client instance.
   */
  #clientsEntries() {
    return this.#loadClients().map((client) => { return [client.name, client]; });
  }

  /**
   * Validates and loads resources from the config object.
   * @returns {Array<Resource>} List of Resource instances.
   * @throws {Error} Throws when the config does not contain a `resources` key.
   */
  #loadResources() {
    if (!this.config || typeof this.config !== 'object' || !('resources' in this.config)) {
      throw new Error('Invalid config file: expected a top-level "resources" key.');
    }

    return Resource.fromListObject(this.config.resources);
  }

  /**
   * Validates and loads clients from the config object.
   * @returns {Array<Client>} List of Client instances.
   * @throws {Error} Throws when the config does not contain a `clients` key.
   */
  #loadClients() {
    if (!this.config || typeof this.config !== 'object' || !('clients' in this.config)) {
      throw new Error('Invalid config file: expected a top-level "clients" key.');
    }

    return Client.fromListObject(this.config.clients);
  }
}

export { ConfigParser };
