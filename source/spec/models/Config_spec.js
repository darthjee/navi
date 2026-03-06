import { fileURLToPath } from 'node:url';

import { Config } from '../../lib/models/Config.js';

describe('Config', () => {
  describe('.fromFile', () => {
    it('returns a Config instance with resources from yaml file', () => {
      const resources = {
        categories: [{ url: '/categories.json', status: 200 }],
      };
      const configFilePath = fileURLToPath(new URL('../fixtures/config/sample_config.yml', import.meta.url));

      const config = Config.fromFile(configFilePath);

      expect(config instanceof Config).toBeTrue();
      expect(config.resources).toEqual(resources);
    });

    it('throws when yaml file does not contain resources key', () => {
      const configFilePath = fileURLToPath(
        new URL('../fixtures/config/missing_resources_sample_confg.yml', import.meta.url),
      );

      expect(() => Config.fromFile(configFilePath)).toThrowError(
        'Invalid config file: expected a top-level "resources" key.',
      );
    });
  });
});
