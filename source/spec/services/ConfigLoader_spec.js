import { fileURLToPath } from 'node:url';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Resource } from '../../lib/models/Resource.js';
import { ConfigLoader } from '../../lib/service/configLoader.js';

describe('ConfigLoader', () => {
  describe('.fromFile', () => {
    it('returns mapped resources by name', () => {
      const expectedResourceRequests = [
        new ResourceRequest({ url: '/categories.json', status: 200 })
      ];
      const expectedResources = {
        categories: new Resource({
          name: 'categories', resourceRequests: expectedResourceRequests
        }),
      };
      const expectedConfig = { resources: expectedResources };

      const file = '../fixtures/config/sample_config.yml';
      const configFilePath = fileURLToPath(new URL(file, import.meta.url));

      const resources = ConfigLoader.fromFile(configFilePath);

      expect(resources).toEqual(expectedConfig);
    });
  });
});
