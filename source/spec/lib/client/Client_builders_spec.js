import { Client } from '../../../lib/client/Client.js';

describe('Client', () => {
  describe('.fromObject', () => {
    describe('when headers are provided', () => {
      it('creates a client with the configured headers', () => {
        const config = {
          base_url: 'https://api.example.com',
          headers: { 'X-Api-Key': 'abc123' },
        };

        const result = Client.fromObject('api', config);

        expect(result.headers).toEqual({ 'X-Api-Key': 'abc123' });
      });
    });

    describe('when headers are not provided', () => {
      it('creates a client with empty headers', () => {
        const config = { base_url: 'https://example.com' };

        const result = Client.fromObject('default', config);

        expect(result.headers).toEqual({});
      });
    });

    describe('when linkText is provided', () => {
      it('creates a client with the configured link text', () => {
        const config = {
          base_url: 'https://example.com',
          linkText: 'Default Domain',
        };

        const result = Client.fromObject('default', config);

        expect(result.linkText).toEqual('Default Domain');
      });
    });

    describe('when linkText is not provided', () => {
      it('creates a client with null link text', () => {
        const config = { base_url: 'https://example.com' };

        const result = Client.fromObject('default', config);

        expect(result.linkText).toBeNull();
      });
    });

    describe('namespace', () => {
      it('defaults to "default" when not given', () => {
        const result = Client.fromObject('default', { base_url: 'https://example.com' });

        expect(result.namespace).toBe('default');
      });

      it('uses the given namespace', () => {
        const result = Client.fromObject('default', { base_url: 'https://example.com' }, { namespace: 'clients' });

        expect(result.namespace).toBe('clients');
      });
    });
  });

  describe('.fromListObject', () => {
    it('propagates the given namespace to every built Client', () => {
      const clients = Client.fromListObject(
        { default: { base_url: 'https://example.com' }, other: { base_url: 'https://other.com' } },
        { namespace: 'clients' },
      );

      expect(clients.every((c) => c.namespace === 'clients')).toBeTrue();
    });

    it('defaults the namespace to "default"', () => {
      const clients = Client.fromListObject({ default: { base_url: 'https://example.com' } });

      expect(clients[0].namespace).toBe('default');
    });
  });
});
