import { ClientNotFound } from '../../../lib/exceptions/ClientNotFound.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { Client } from '../../../lib/services/Client.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';

describe('ClientRegistry', () => {
  let defaultClient;
  let otherClient;

  beforeEach(() => {
    defaultClient = ClientFactory.build();
    otherClient = new Client({ name: 'other', baseUrl: 'https://other.com' });
  });

  afterEach(() => {
    ClientRegistry.reset();
  });

  describe('#getClient', () => {
    describe('when default and other clients exist', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ default: defaultClient, other: otherClient });
      });

      describe('when a client with the given name exists', () => {
        it('returns the client by name', () => {
          expect(clientRegistry.getClient('other')).toBe(otherClient);
        });
      });

      describe('when name is "default" and a default client exists', () => {
        it('returns the default client', () => {
          expect(clientRegistry.getClient('default')).toBe(defaultClient);
        });
      });

      describe('when no name is given and a default client exists', () => {
        it('returns the default client', () => {
          expect(clientRegistry.getClient()).toBe(defaultClient);
        });
      });
    });

    describe('when only one client exists (no default)', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ other: otherClient });
      });

      describe('when no name is given and no default client exists but only one client', () => {
        it('returns the single client', () => {
          expect(clientRegistry.getClient()).toBe(otherClient);
        });
      });

      describe('when name is "default", no default client exists, and only one client exists', () => {
        it('returns the single client', () => {
          expect(clientRegistry.getClient('default')).toBe(otherClient);
        });
      });
    });

    describe('when the named client does not exist', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ default: defaultClient });
      });

      it('throws ClientNotFound with the missing name', () => {
        expect(() => clientRegistry.getClient('unknown')).toThrowError(
          ClientNotFound,
          'Client "unknown" not found.',
        );
      });
    });

    describe('when no default client and multiple clients exist', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({
          other: otherClient,
          another: new Client({ name: 'another', baseUrl: 'https://another.com' }),
        });
      });

      describe('when no name is given, no default client, and multiple clients exist', () => {
        it('throws ClientNotFound for default', () => {
          expect(() => clientRegistry.getClient()).toThrowError(
            ClientNotFound,
            'Client "default" not found.',
          );
        });
      });

      describe('when name is "default", no default client, and multiple clients exist', () => {
        it('throws ClientNotFound for default', () => {
          expect(() => clientRegistry.getClient('default')).toThrowError(
            ClientNotFound,
            'Client "default" not found.',
          );
        });
      });
    });
  });

  describe('.build', () => {
    it('creates and returns a ClientRegistry instance', () => {
      const instance = ClientRegistry.build({ default: defaultClient });
      expect(instance).toBeInstanceOf(ClientRegistry);
    });

    it('throws if called twice without reset', () => {
      ClientRegistry.build({ default: defaultClient });
      expect(() => ClientRegistry.build({})).toThrowError(
        'ClientRegistry.build() has already been called. Call reset() first.',
      );
    });

    it('allows build after reset', () => {
      ClientRegistry.build({ default: defaultClient });
      ClientRegistry.reset();
      expect(() => ClientRegistry.build({ default: defaultClient })).not.toThrow();
    });
  });

  describe('.getClient', () => {
    beforeEach(() => {
      ClientRegistry.build({ default: defaultClient, other: otherClient });
    });

    it('returns the client by name from the singleton', () => {
      expect(ClientRegistry.getClient('other')).toBe(otherClient);
    });

    it('returns the default client when no name is given', () => {
      expect(ClientRegistry.getClient()).toBe(defaultClient);
    });

    it('throws when the registry has not been built', () => {
      ClientRegistry.reset();
      expect(() => ClientRegistry.getClient('other')).toThrowError(
        'ClientRegistry has not been built. Call ClientRegistry.build() first.',
      );
    });
  });

  describe('.all', () => {
    beforeEach(() => {
      ClientRegistry.build({ default: defaultClient, other: otherClient });
    });

    it('returns all registered clients', () => {
      expect(ClientRegistry.all()).toEqual(jasmine.arrayContaining([defaultClient, otherClient]));
    });

    it('returns the correct number of clients', () => {
      expect(ClientRegistry.all().length).toBe(2);
    });

    it('throws when the registry has not been built', () => {
      ClientRegistry.reset();
      expect(() => ClientRegistry.all()).toThrowError(
        'ClientRegistry has not been built. Call ClientRegistry.build() first.',
      );
    });
  });
});
