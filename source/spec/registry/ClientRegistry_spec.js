import { ClientNotFound } from '../../lib/exceptions/ClientNotFound.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { Client } from '../../lib/services/Client.js';
import { ClientFactory } from '../support/factories/ClientFactory.js';

describe('ClientRegistry', () => {
  let defaultClient;
  let otherClient;

  beforeEach(() => {
    defaultClient = ClientFactory.build();
    otherClient = new Client({ name: 'other', baseUrl: 'https://other.com' });
  });

  describe('#getClient', () => {
    describe('when a client with the given name exists', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ default: defaultClient, other: otherClient });
      });

      it('returns the client by name', () => {
        expect(clientRegistry.getClient('other')).toBe(otherClient);
      });
    });

    describe('when name is "default" and a default client exists', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ default: defaultClient, other: otherClient });
      });

      it('returns the default client', () => {
        expect(clientRegistry.getClient('default')).toBe(defaultClient);
      });
    });

    describe('when no name is given and a default client exists', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ default: defaultClient, other: otherClient });
      });

      it('returns the default client', () => {
        expect(clientRegistry.getClient()).toBe(defaultClient);
      });
    });

    describe('when no name is given and no default client exists but only one client', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ other: otherClient });
      });

      it('returns the single client', () => {
        expect(clientRegistry.getClient()).toBe(otherClient);
      });
    });

    describe('when name is "default", no default client exists, and only one client exists', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({ other: otherClient });
      });

      it('returns the single client', () => {
        expect(clientRegistry.getClient('default')).toBe(otherClient);
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

    describe('when no name is given, no default client, and multiple clients exist', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({
          other: otherClient,
          another: new Client({ name: 'another', baseUrl: 'https://another.com' }),
        });
      });

      it('throws ClientNotFound for default', () => {
        expect(() => clientRegistry.getClient()).toThrowError(
          ClientNotFound,
          'Client "default" not found.',
        );
      });
    });

    describe('when name is "default", no default client, and multiple clients exist', () => {
      let clientRegistry;

      beforeEach(() => {
        clientRegistry = new ClientRegistry({
          other: otherClient,
          another: new Client({ name: 'another', baseUrl: 'https://another.com' }),
        });
      });

      it('throws ClientNotFound for default', () => {
        expect(() => clientRegistry.getClient('default')).toThrowError(
          ClientNotFound,
          'Client "default" not found.',
        );
      });
    });
  });
});
