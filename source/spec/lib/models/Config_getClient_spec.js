import { ClientNotFound } from '../../../lib/exceptions/ClientNotFound.js';
import { Config } from '../../../lib/models/Config.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { Client } from '../../../lib/services/Client.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';

describe('Config', () => {
  afterEach(() => {
    ResourceRegistry.reset();
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
});
