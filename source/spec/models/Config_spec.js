import { fileURLToPath } from 'node:url';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Resource } from '../../lib/models/Resource.js';
import { Client } from '../../lib/services/Client.js';

import { Config } from '../../lib/models/Config.js';

describe('Config', () => {
  let expectedResources;
  let expectedClients;
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
        expectedClients = {
          default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
        };
      });

      it('returns a Config instance with resources from yaml file', () => {
        const file = '../fixtures/config/sample_config.yml';
        const configFilePath = fileURLToPath(new URL(file, import.meta.url));

        const config = Config.fromFile(configFilePath);

        expect(config instanceof Config).toBeTrue();
        expect(config.resources).toEqual(expectedResources);
        expect(config.clients).toEqual(expectedClients);
      });
    });

    describe('when the yaml file does not contain clients key', () => {
      it('throws an error', () => {
        const file = '../fixtures/config/missing_clients_sample_config.yml';
        const configFilePath = fileURLToPath(new URL(file, import.meta.url));

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "clients" key.',
        );
      });
    });

    describe('when the yaml file does not contain resources key', () => {
      it('throws an error', () => {
        const file = '../fixtures/config/missing_resources_sample_config.yml';
        const configFilePath = fileURLToPath(new URL(file, import.meta.url));

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
