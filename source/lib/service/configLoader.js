import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { Resource } from '../models/Resource.js';

/**
 * ConfigLoader loads configuration files and maps them to resource objects.
 * @author darthjee
 */
class ConfigLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Creates a mapped resource object from a YAML file.
   *
   * The YAML must contain a top-level `resources` key.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {Record<string, Resource>} Mapped resources by name.
   * @throws {Error} Throws when the file is invalid or does not contain a `resources` key.
   */
  static fromFile(filePath) {
    return new ConfigLoader(filePath).load();
  }

  load() {
    const mappedResources = Object.fromEntries(
      this.#resourcesEntries()
    );

    return { resources: mappedResources };
  }

  #resourcesEntries() {
    const resources = this.#loadResources();

    return resources.map((resource) => { return [resource.name, resource]; });
  }


  #loadResources() {
    const parsedConfig = this.#parseConfig();
    return Resource.fromListObject(parsedConfig.resources);
  }

  #parseConfig() {
    const parsedConfig = YAML.parse(this.#yamlContent());

    if (!parsedConfig || typeof parsedConfig !== 'object' || !('resources' in parsedConfig)) {
      throw new Error('Invalid config file: expected a top-level "resources" key.');
    }

    return parsedConfig;
  }

  #yamlContent() {
    return readFileSync(this.filePath, 'utf8');
  }
}

export { ConfigLoader };