import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { Resource } from '../models/Resource.js';
import { Client } from '../services/Client.js';

/**
 * ConfigLoader loads configuration files and maps them to resource objects.
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
   * @throws {Error} Throws when the file is invalid or does not contain a `resources` key.
   */
  static fromFile(filePath) {
    return new ConfigLoader(filePath).load();
  }

  /**
   * Loads the configuration file and maps the resources and clients to model instances.
   * @returns {{resources: Record<string, Resource>, clients: Record<string, Client>}} Mapped resources and clients by name.
   */
  load() {
    const mappedResources = Object.fromEntries(
      this.#resourcesEntries()
    );

    const mappedClients = Object.fromEntries(
      this.#clientsEntries()
    );

    return { resources: mappedResources, clients: mappedClients };
  }

  /**
   * Maps the resources to entries suitable for Object.fromEntries.
   * @returns {Array<[string, Resource]>} Entries of resource name and Resource instance.
   */
  #resourcesEntries() {
    const resources = this.#loadResources();

    return resources.map((resource) => { return [resource.name, resource]; });
  }

  /**
   * Maps the clients to entries suitable for Object.fromEntries.
   * @returns {Array<[string, Client]>} Entries of client name and Client instance.
   */
  #clientsEntries() {
    const clients = this.#loadClients();

    return clients.map((client) => { return [client.name, client]; });
  }

  /**
   * Loads the resources from the YAML configuration file and maps them to Resource instances.
   * @returns {Array<Resource>} List of Resource instances.
   */
  #loadResources() {
    const parsedConfig = this.#parseConfig();
    return Resource.fromListObject(parsedConfig.resources);
  }

  /**
   * Loads the clients from the YAML configuration file and maps them to Client instances.
   * @returns {Array<Client>} List of Client instances.
   */
  #loadClients() {
    const parsedConfig = this.#parseConfig();

    if (!parsedConfig.clients) {
      return [];
    }

    return Client.fromListObject(parsedConfig.clients);
  }

  /**
   * Parses the YAML configuration file and validates its structure.
   * @returns {object} Parsed configuration object.
   * @throws {Error} Throws when the configuration is invalid.
   */
  #parseConfig() {
    const parsedConfig = YAML.parse(this.#yamlContent());

    if (!parsedConfig || typeof parsedConfig !== 'object' || !('resources' in parsedConfig)) {
      throw new Error('Invalid config file: expected a top-level "resources" key.');
    }

    return parsedConfig;
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