import { InvalidEmitMethod } from '../../../../lib/exceptions/config/InvalidEmitMethod.js';
import { MissingEmitUrl } from '../../../../lib/exceptions/config/MissingEmitUrl.js';
import { ResourceRequestEmit } from '../../../../lib/models/request/ResourceRequestEmit.js';

describe('ResourceRequestEmit', () => {
  describe('constructor', () => {
    describe('with a bare-name client', () => {
      it('parses clientName and defaults clientNamespace to null', () => {
        const emit = new ResourceRequestEmit({ client: 'myClient', method: 'POST', url: '/emit' });

        expect(emit.clientName).toBe('myClient');
        expect(emit.clientNamespace).toBeNull();
        expect(emit.method).toBe('POST');
        expect(emit.url).toBe('/emit');
      });
    });

    describe('with a {name, namespace} client', () => {
      it('parses clientName and the explicit clientNamespace', () => {
        const emit = new ResourceRequestEmit({
          client: { name: 'myClient', namespace: 'clients' },
          method: 'PUT',
          url: '/emit',
        });

        expect(emit.clientName).toBe('myClient');
        expect(emit.clientNamespace).toBe('clients');
        expect(emit.method).toBe('PUT');
      });
    });

    describe('with no client', () => {
      it('leaves clientName undefined and clientNamespace null', () => {
        const emit = new ResourceRequestEmit({ method: 'PATCH', url: '/emit' });

        expect(emit.clientName).toBeUndefined();
        expect(emit.clientNamespace).toBeNull();
      });
    });

    describe('with a missing method', () => {
      it('throws InvalidEmitMethod', () => {
        expect(() => new ResourceRequestEmit({ url: '/emit' }))
          .toThrowMatching((error) => error instanceof InvalidEmitMethod);
      });
    });

    describe('with an invalid method', () => {
      it('throws InvalidEmitMethod', () => {
        expect(() => new ResourceRequestEmit({ method: 'GET', url: '/emit' }))
          .toThrowMatching((error) => error instanceof InvalidEmitMethod);
      });
    });

    describe('with a missing url', () => {
      it('throws MissingEmitUrl', () => {
        expect(() => new ResourceRequestEmit({ method: 'POST' }))
          .toThrowMatching((error) => error instanceof MissingEmitUrl);
      });
    });
  });

  describe('.fromObject', () => {
    it('returns a ResourceRequestEmit instance', () => {
      const emit = ResourceRequestEmit.fromObject({ client: 'myClient', method: 'POST', url: '/emit' });

      expect(emit).toBeInstanceOf(ResourceRequestEmit);
      expect(emit.clientName).toBe('myClient');
    });
  });
});
