import { Client } from './Client.js';
import { MissingClientsConfig } from '../exceptions/MissingClientsConfig.js';
import { MissingResourceConfig } from '../exceptions/MissingResourceConfig.js';
import { Resource } from '../models/Resource.js';
import { WebConfig } from '../models/WebConfig.js';
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
   * Parses the config object into a structured configuration.
   * @returns {{
   * resources: Record<string, Resource>,
   * clients: Record<string, Client>,
   * workersConfig: WorkersConfig,
   * webConfig: WebConfig|null
   * }} Parsed configuration with resources, clients, workersConfig, and webConfig.
   */
  parse() {
    const mappedResources = Object.fromEntries(
      this.#resourcesEntries()
    );

    const mappedClients = Object.fromEntries(
      this.#clientsEntries()
    );

    return {
      resources:     mappedResources,
      clients:       mappedClients,
      workersConfig: this.#workersConfig(),
      webConfig:     this.#webConfig(),
    };
  }

  #workersConfig() {
    return new WorkersConfig(this.config.workers);
  }

  #webConfig() {
    if (!this.config.web) return null;
    return new WebConfig(this.config.web);
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
      throw new MissingResourceConfig();
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
      throw new MissingClientsConfig();
    }

    return Client.fromListObject(this.config.clients);
  }
}

export { ConfigParser };
