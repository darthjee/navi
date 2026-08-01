import { ConfigurationFileNotFound } from './ConfigurationFileNotFound.js';

/**
 * ConfigurationIncludeNotFound is thrown when a file referenced by a top-level
 * `include:` list cannot be read.
 * @author darthjee
 */
class ConfigurationIncludeNotFound extends ConfigurationFileNotFound {
  constructor(file) {
    super(file);
    this.name = 'ConfigurationIncludeNotFound';
  }
}

export { ConfigurationIncludeNotFound };
