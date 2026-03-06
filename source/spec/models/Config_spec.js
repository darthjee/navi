import { fileURLToPath } from 'node:url';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Resource } from '../../lib/models/Resource.js';

import { Config } from '../../lib/models/Config.js';

describe('Config', () => {
  let expectedResources;
  let expectedResourceRequests;

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      beforeEach(() => {
        expectedResourceRequests = [
          new ResourceRequest({ url: '/categories.json', status: 200 })
        ];
        expectedResources = {
          categories: new Resource({
            name: 'categories', resourceRequests: expectedResourceRequests
          }),
        };
      });

      it('returns a Config instance with resources from yaml file', () => {
        const configFilePath = fileURLToPath(new URL('../fixtures/config/sample_config.yml', import.meta.url));

        const config = Config.fromFile(configFilePath);

        expect(config instanceof Config).toBeTrue();
        expect(config.resources).toEqual(expectedResources);
      });
    });

    describe('when the yaml file does not contain resources key', () => {
      it('throws an error', () => {
        const configFilePath = fileURLToPath(
          new URL('../fixtures/config/missing_resources_sample_config.yml', import.meta.url),
        );

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
