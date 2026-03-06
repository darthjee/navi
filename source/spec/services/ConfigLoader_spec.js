import { fileURLToPath } from 'node:url';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Resource } from '../../lib/models/Resource.js';
import { ConfigLoader } from '../../lib/service/configLoader.js';

describe('ConfigLoader', () => {
  let expectedConfig;
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
        expectedConfig = { resources: expectedResources };
      });

      it('returns mapped resources by name', () => {
        const file = '../fixtures/config/sample_config.yml';
        const configFilePath = fileURLToPath(new URL(file, import.meta.url));

        const resources = ConfigLoader.fromFile(configFilePath);

        expect(resources).toEqual(expectedConfig);
      });
    });

    describe('when the yaml file does not contain resources key', () => {
      it('throws an error', () => {
        const file = '../fixtures/config/missing_resources_sample_config.yml';
        const configFilePath = fileURLToPath(new URL(file, import.meta.url));

        expect(() => ConfigLoader.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
