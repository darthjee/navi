import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Resource } from '../../lib/models/Resource.js';
import { Client } from '../../lib/services/Client.js';
import { ConfigParser } from '../../lib/services/ConfigParser.js';
import { WorkersConfig } from '../../lib/models/WorkersConfig.js';

describe('ConfigParser', () => {
  let expectedResources;
  let expectedClients;
  let expectedResourceRequests;
  let expectedWorkersConfig;

  describe('.fromObject', () => {
    describe('when the config object is valid', () => {
      let config;

      beforeEach(() => {
        config = {
          clients: {
            default: { base_url: 'https://example.com' },
          },
          resources: {
            categories: [
              { url: '/categories.json', status: 200 },
            ],
          },
        };

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
        expectedWorkersConfig = new WorkersConfig({ quantity: 1 });
      });

      it('returns mapped resources by name', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.resources).toEqual(expectedResources);
      });

      it('returns mapped clients by name', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.clients).toEqual(expectedClients);
      });

      it('returns workers configuration', () => {
        const result = ConfigParser.fromObject(config);

        expect(result.workers).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the config object does not contain a clients key', () => {
      it('throws an error', () => {
        const config = {
          resources: {
            categories: [{ url: '/categories.json', status: 200 }],
          },
        };

        expect(() => ConfigParser.fromObject(config)).toThrowError(
          'Invalid config file: expected a top-level "clients" key.',
        );
      });
    });

    describe('when the config object does not contain a resources key', () => {
      it('throws an error', () => {
        const config = {
          clients: {
            default: { base_url: 'https://example.com' },
          },
        };

        expect(() => ConfigParser.fromObject(config)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });

    describe('when the config object is null', () => {
      it('throws an error for missing resources key', () => {
        expect(() => ConfigParser.fromObject(null)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
