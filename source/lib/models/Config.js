import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { ResourceRequest } from './ResourceRequest.js';
import { Resource } from './Resource.js';

/**
 * Config is a class that represents the configuration for the application.
 * It includes the resources that are to be included in the configuration.
 * @author darthjee
 */
class Config {
  /**
   * @param {object} attributes The parameters for creating a Config instance.
   * @param {object} attributes.resources The resources to be included in the configuration.
   */
  constructor(attributes) {
    this.resources = attributes.resources;
  }

  /**
   * Creates a Config instance from a YAML file.
   *
   * The YAML must contain a top-level `resources` key.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {Config} A new Config instance.
   * @throws {Error} Throws when the file is invalid or does not contain a `resources` key.
   */
  static fromFile(filePath) {
    const yamlContent = readFileSync(filePath, 'utf8');
    const parsedConfig = YAML.parse(yamlContent);

    if (!parsedConfig || typeof parsedConfig !== 'object' || !('resources' in parsedConfig)) {
      throw new Error('Invalid config file: expected a top-level "resources" key.');
    }

    let mapped_resources = {};
    
    for (let resourceName in parsedConfig.resources) {
      let resourceRequests =  ResourceRequest.fromList(parsedConfig.resources[resourceName]);
      let resource = new Resource({ name: resourceName, resourceRequests: resourceRequests });
      mapped_resources[resourceName] = resource;
    }

    return new Config({ resources: mapped_resources });
  }
}

export { Config };