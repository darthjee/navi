import { Client } from './Client.js';
import { MissingClientsConfig } from '../exceptions/MissingClientsConfig.js';
import { MissingResourceConfig } from '../exceptions/MissingResourceConfig.js';
import { LogConfig } from '../models/LogConfig.js';
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
   * webConfig: WebConfig|null,
   * logConfig: LogConfig
   * }} Parsed configuration with resources, clients, workersConfig, webConfig, and logConfig.
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
      logConfig:     this.#logConfig(),
    };
  }

  /**
   * Creates a WorkersConfig from the parsed YAML workers section.
   * @returns {WorkersConfig} The workers configuration instance.
   */
  #workersConfig() {
    return new WorkersConfig(this.config.workers);
  }

  /**
   * Creates a WebConfig from the parsed YAML web section, or null if absent.
   * @returns {WebConfig|null} The web configuration instance or null.
   */
  #webConfig() {
    if (!this.config.web) return null;
    return new WebConfig(this.config.web);
  }

  /**
   * Creates a LogConfig from the parsed YAML log section.
   * @returns {LogConfig} The log configuration instance.
   */
  #logConfig() {
    return LogConfig.fromObject(this.config.log);
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
   * @throws {MissingResourceConfig} Throws when the config does not contain a `resources` key.
   */
  #loadResources() {
    this.#requireKey('resources', MissingResourceConfig);

    return Resource.fromListObject(this.config.resources);
  }

  /**
   * Validates and loads clients from the config object.
   * @returns {Array<Client>} List of Client instances.
   * @throws {MissingClientsConfig} Throws when the config does not contain a `clients` key.
   */
  #loadClients() {
    this.#requireKey('clients', MissingClientsConfig);

    return Client.fromListObject(this.config.clients);
  }

  /**
   * Validates that the config object contains the specified key.
   * @param {string} key - The key to check for.
   * @param {Function} ExceptionClass - The exception class to throw if the key is missing.
   * @returns {void}
   * @throws {Error} Throws if the config is invalid or missing the key.
   */
  #requireKey(key, ExceptionClass) {
    if (!this.config || typeof this.config !== 'object' || !(key in this.config)) {
      throw new ExceptionClass();
    }
  }
}

export { ConfigParser };
