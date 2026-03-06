import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { Resource } from '../models/Resource.js';

/**
 * ConfigLoader loads configuration files and maps them to resource objects.
 * @author darthjee
 */
class ConfigLoader {
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
    const yamlContent = readFileSync(filePath, 'utf8');
    const parsedConfig = YAML.parse(yamlContent);

    if (!parsedConfig || typeof parsedConfig !== 'object' || !('resources' in parsedConfig)) {
      throw new Error('Invalid config file: expected a top-level "resources" key.');
    }

    const resources = Resource.fromListObject(parsedConfig.resources);

    const mapped_resources = Object.fromEntries(
      resources.map((resource) => {
        return [resource.name, resource];
      })
    );

    return mapped_resources;
  }
}

export { ConfigLoader };