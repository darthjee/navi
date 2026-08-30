import { InvalidEmitCooldown } from '../../../../lib/exceptions/config/InvalidEmitCooldown.js';
import { InvalidEmitHeaders } from '../../../../lib/exceptions/config/InvalidEmitHeaders.js';
import { InvalidEmitMethod } from '../../../../lib/exceptions/config/InvalidEmitMethod.js';
import { InvalidEmitRetries } from '../../../../lib/exceptions/config/InvalidEmitRetries.js';
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

    describe('retries', () => {
      describe('when not given', () => {
        it('exposes undefined', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit' });

          expect(emit.retries).toBeUndefined();
        });
      });

      describe('when given a positive number', () => {
        it('exposes the configured value', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', retries: 5 });

          expect(emit.retries).toBe(5);
        });
      });

      describe('when given 0', () => {
        it('accepts it as a valid value (one attempt, no retries)', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', retries: 0 });

          expect(emit.retries).toBe(0);
        });
      });

      describe('when given a negative number', () => {
        it('throws InvalidEmitRetries', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', retries: -1 }))
            .toThrowMatching((error) => error instanceof InvalidEmitRetries);
        });
      });

      describe('when given a non-numeric value', () => {
        it('throws InvalidEmitRetries', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', retries: 'five' }))
            .toThrowMatching((error) => error instanceof InvalidEmitRetries);
        });
      });
    });

    describe('cooldown', () => {
      describe('when not given', () => {
        it('exposes undefined', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit' });

          expect(emit.cooldown).toBeUndefined();
        });
      });

      describe('when given a positive number', () => {
        it('exposes the configured value', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', cooldown: 5000 });

          expect(emit.cooldown).toBe(5000);
        });
      });

      describe('when given 0', () => {
        it('accepts it as a valid value', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', cooldown: 0 });

          expect(emit.cooldown).toBe(0);
        });
      });

      describe('when given a negative number', () => {
        it('throws InvalidEmitCooldown', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', cooldown: -1 }))
            .toThrowMatching((error) => error instanceof InvalidEmitCooldown);
        });
      });

      describe('when given a non-numeric value', () => {
        it('throws InvalidEmitCooldown', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', cooldown: 'five thousand' }))
            .toThrowMatching((error) => error instanceof InvalidEmitCooldown);
        });
      });
    });

    describe('headers', () => {
      describe('when not given', () => {
        it('exposes an empty object', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit' });

          expect(emit.headers).toEqual({});
        });
      });

      describe('when given a valid map', () => {
        it('exposes it unchanged, leaving $VAR-looking literals as-is', () => {
          const headers = { Authorization: 'Bearer ${TOKEN}', 'X-Count': 3, 'X-Flag': true };
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', headers });

          expect(emit.headers).toEqual(headers);
        });
      });

      describe('when given an array', () => {
        it('throws InvalidEmitHeaders', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', headers: ['a', 'b'] }))
            .toThrowMatching((error) => error instanceof InvalidEmitHeaders);
        });
      });

      describe('when given a non-object primitive', () => {
        it('throws InvalidEmitHeaders', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', headers: 'nope' }))
            .toThrowMatching((error) => error instanceof InvalidEmitHeaders);
        });
      });

      describe('when given an object with a nested-object value', () => {
        it('throws InvalidEmitHeaders', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', headers: { X: { nested: 1 } } }))
            .toThrowMatching((error) => error instanceof InvalidEmitHeaders);
        });
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
