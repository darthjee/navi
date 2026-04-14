import { ClientNotFound } from '../../../lib/exceptions/ClientNotFound.js';
import { Config } from '../../../lib/models/Config.js';
import { WorkersConfig } from '../../../lib/models/WorkersConfig.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { Client } from '../../../lib/services/Client.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

describe('Config', () => {
  let expectedResources;
  let expectedClients;
  let expectedClientRegistry;
  let expectedResourceRegistry;
  let expectedWorkersConfig;

  afterEach(() => {
    ResourceRegistry.reset();
  });

  describe('#getResource', () => {
    let config;
    let resource;

    beforeEach(() => {
      resource = ResourceFactory.build();
      config = new Config({
        resources: { categories: resource },
        clients: {},
      });
    });

    describe('when the resource exists', () => {
      it('returns the resource', () => {
        expect(config.getResource('categories')).toBe(resource);
      });
    });

    describe('when the resource does not exist', () => {
      it('throws an error', () => {
        expect(() => config.getResource('unknown')).toThrowError('Resource "unknown" not found.');
      });
    });
  });

  describe('#getClient', () => {
    let defaultClient;
    let otherClient;

    beforeEach(() => {
      defaultClient = ClientFactory.build();
      otherClient = new Client({ name: 'other', baseUrl: 'https://other.com' });
    });

    describe('when default and other clients exist', () => {
      let config;

      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { default: defaultClient, other: otherClient },
        });
      });

      describe('when a client with the given name exists', () => {
        it('returns the client by name', () => {
          expect(config.getClient('other')).toBe(otherClient);
        });
      });

      describe('when name is "default" and a default client exists', () => {
        it('returns the default client', () => {
          expect(config.getClient('default')).toBe(defaultClient);
        });
      });

      describe('when no name is given and a default client exists', () => {
        it('returns the default client', () => {
          expect(config.getClient()).toBe(defaultClient);
        });
      });
    });

    describe('when only one client exists (no default)', () => {
      let config;

      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { other: otherClient },
        });
      });

      describe('when no name is given and no default client exists but only one client', () => {
        it('returns the single client', () => {
          expect(config.getClient()).toBe(otherClient);
        });
      });

      describe('when name is "default", no default client exists, and only one client exists', () => {
        it('returns the single client', () => {
          expect(config.getClient('default')).toBe(otherClient);
        });
      });
    });

    describe('when the named client does not exist', () => {
      let config;

      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { default: defaultClient },
        });
      });

      it('throws ClientNotFound', () => {
        expect(() => config.getClient('unknown')).toThrowError(ClientNotFound, 'Client "unknown" not found.');
      });
    });

    describe('when no default client and multiple clients exist', () => {
      let config;

      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { other: otherClient, another: new Client({ name: 'another', baseUrl: 'https://another.com' }) },
        });
      });

      describe('when no name is given, no default client, and multiple clients exist', () => {
        it('throws ClientNotFound', () => {
          expect(() => config.getClient()).toThrowError(ClientNotFound, 'Client "default" not found.');
        });
      });

      describe('when name is "default", no default client, and multiple clients exist', () => {
        it('throws ClientNotFound', () => {
          expect(() => config.getClient('default')).toThrowError(ClientNotFound, 'Client "default" not found.');
        });
      });
    });
  });

  describe('.fromFile', () => {
    describe('when the yaml file is valid', () => {
      beforeEach(() => {
        expectedResources = {
          categories: ResourceFactory.build(),
        };
        expectedClients = {
          default: ClientFactory.build({ timeout: 5000 }),
        };
        expectedClientRegistry = ClientRegistryFactory.build(expectedClients);
        expectedResourceRegistry = new ResourceRegistry(expectedResources);
        expectedWorkersConfig = new WorkersConfig({ quantity: 5 });
      });

      it('returns a Config instance with resources from yaml file', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const config = Config.fromFile(configFilePath);

        expect(config instanceof Config).toBeTrue();
        expect(config.resourceRegistry).toEqual(expectedResourceRegistry);
        expect(config.clientRegistry).toEqual(expectedClientRegistry);
        expect(config.workersConfig).toEqual(expectedWorkersConfig);
      });
    });

    describe('when the yaml file does not contain clients key', () => {
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_clients_sample_config.yml');

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "clients" key.',
        );
      });
    });

    describe('when the yaml file does not contain resources key', () => {
      it('throws an error', () => {
        const configFilePath = FixturesUtils.getFixturePath('config/missing_resources_sample_config.yml');

        expect(() => Config.fromFile(configFilePath)).toThrowError(
          'Invalid config file: expected a top-level "resources" key.',
        );
      });
    });
  });
});
