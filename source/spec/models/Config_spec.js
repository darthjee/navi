import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Config } from '../../lib/models/Config.js';

describe('Config', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'navi-config-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('.fromFile', () => {
    it('returns a Config instance with resources from yaml file', () => {
      const resources = {
        categories: [{ url: '/categories.json', status: 200 }],
      };
      const configFilePath = join(tempDir, 'config.yml');

      writeFileSync(configFilePath, `resources:\n  categories:\n    - url: /categories.json\n      status: 200\n`);

      const config = Config.fromFile(configFilePath);

      expect(config instanceof Config).toBeTrue();
      expect(config.resources).toEqual(resources);
    });

    it('throws when yaml file does not contain resources key', () => {
      const configFilePath = join(tempDir, 'config.yml');

      writeFileSync(configFilePath, 'client:\n  domain: https://example.com\n');

      expect(() => Config.fromFile(configFilePath)).toThrowError(
        'Invalid config file: expected a top-level "resources" key.',
      );
    });
  });
});
