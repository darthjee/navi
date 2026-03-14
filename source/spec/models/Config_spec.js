import { fileURLToPath } from 'node:url';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';
import { Resource } from '../../lib/models/Resource.js';
import { Client } from '../../lib/services/Client.js';
import { ClientNotFound } from '../../lib/exceptions/ClientNotFound.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { ResourceRegistry } from '../../lib/models/ResourceRegistry.js';

import { Config } from '../../lib/models/Config.js';

describe('Config', () => {
  let expectedResources;
  let expectedClients;
  let expectedResourceRequests;
  let expectedClientRegistry;
  let expectedResourceRegistry;

  describe('#getResource', () => {
    let config;
    let resource;

    beforeEach(() => {
      resource = new Resource({
        name: 'categories',
        resourceRequests: [new ResourceRequest({ url: '/categories.json', status: 200 })],
      });
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
    let config;
    let defaultClient;
    let otherClient;

    beforeEach(() => {
      defaultClient = new Client({ name: 'default', baseUrl: 'https://example.com' });
      otherClient = new Client({ name: 'other', baseUrl: 'https://other.com' });
    });

    describe('when a client with the given name exists', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { default: defaultClient, other: otherClient },
        });
      });

      it('returns the client by name', () => {
        expect(config.getClient('other')).toBe(otherClient);
      });
    });

    describe('when name is "default" and a default client exists', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { default: defaultClient, other: otherClient },
        });
      });

      it('returns the default client', () => {
        expect(config.getClient('default')).toBe(defaultClient);
      });
    });

    describe('when no name is given and a default client exists', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { default: defaultClient, other: otherClient },
        });
      });

      it('returns the default client', () => {
        expect(config.getClient()).toBe(defaultClient);
      });
    });

    describe('when no name is given and no default client exists but only one client', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { other: otherClient },
        });
      });

      it('returns the single client', () => {
        expect(config.getClient()).toBe(otherClient);
      });
    });

    describe('when name is "default", no default client exists, and only one client exists', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { other: otherClient },
        });
      });

      it('returns the single client', () => {
        expect(config.getClient('default')).toBe(otherClient);
      });
    });

    describe('when the named client does not exist', () => {
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

    describe('when no name is given, no default client, and multiple clients exist', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { other: otherClient, another: new Client({ name: 'another', baseUrl: 'https://another.com' }) },
        });
      });

      it('throws ClientNotFound', () => {
        expect(() => config.getClient()).toThrowError(ClientNotFound, 'Client "default" not found.');
      });
    });

    describe('when name is "default", no default client, and multiple clients exist', () => {
      beforeEach(() => {
        config = new Config({
          resources: {},
          clients: { other: otherClient, another: new Client({ name: 'another', baseUrl: 'https://another.com' }) },
        });
      });

      it('throws ClientNotFound', () => {
        expect(() => config.getClient('default')).toThrowError(ClientNotFound, 'Client "default" not found.');
      });
    });
  });

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
        expectedClientRegistry = new ClientRegistry(expectedClients);
        expectedResourceRegistry = new ResourceRegistry(expectedResources);
      });

      it('returns a Config instance with resources from yaml file', () => {
        const file = '../fixtures/config/sample_config.yml';
        const configFilePath = fileURLToPath(new URL(file, import.meta.url));

        const config = Config.fromFile(configFilePath);

        expect(config instanceof Config).toBeTrue();
        expect(config.resourceRegistry).toEqual(expectedResourceRegistry);
        expect(config.clientRegistry).toEqual(expectedClientRegistry);
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
