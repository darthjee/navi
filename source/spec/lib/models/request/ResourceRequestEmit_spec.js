import { InvalidEmitBodyTemplate } from '../../../../lib/exceptions/config/InvalidEmitBodyTemplate.js';
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

    describe('body_template', () => {
      describe('when not given', () => {
        it('exposes undefined', () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit' });

          expect(emit.bodyTemplate).toBeUndefined();
        });
      });

      describe('when given a valid plain object', () => {
        it('exposes it unchanged', () => {
          const bodyTemplate = { id: '{:id}', wrapped: { value: '{:.}' } };
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', body_template: bodyTemplate });

          expect(emit.bodyTemplate).toEqual(bodyTemplate);
        });
      });

      describe('when given a valid array', () => {
        it('exposes it unchanged', () => {
          const bodyTemplate = ['{:id}', '{:name}'];
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', body_template: bodyTemplate });

          expect(emit.bodyTemplate).toEqual(bodyTemplate);
        });
      });

      describe('when given a string', () => {
        it('throws InvalidEmitBodyTemplate', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', body_template: 'nope' }))
            .toThrowMatching((error) => error instanceof InvalidEmitBodyTemplate);
        });
      });

      describe('when given a number', () => {
        it('throws InvalidEmitBodyTemplate', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', body_template: 42 }))
            .toThrowMatching((error) => error instanceof InvalidEmitBodyTemplate);
        });
      });

      describe('when given null explicitly', () => {
        it('throws InvalidEmitBodyTemplate', () => {
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', body_template: null }))
            .toThrowMatching((error) => error instanceof InvalidEmitBodyTemplate);
        });
      });

      describe('when given a non-plain object (a class instance)', () => {
        it('throws InvalidEmitBodyTemplate', () => {
          class SomeClass {}
          expect(() => new ResourceRequestEmit({ method: 'POST', url: '/emit', body_template: new SomeClass() }))
            .toThrowMatching((error) => error instanceof InvalidEmitBodyTemplate);
        });
      });
    });
  });

  describe('#resolveBody', () => {
    describe('when no body_template is configured', () => {
      it('returns the item unchanged', () => {
        const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit' });
        const item = { id: 1, name: 'Widget' };

        expect(emit.resolveBody(item)).toBe(item);
      });
    });

    describe('when the template has a whole-token string value', () => {
      it('splices the actual value, preserving type (string)', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { name: '{:name}' },
        });

        expect(emit.resolveBody({ name: 'Widget' })).toEqual({ name: 'Widget' });
      });

      it('splices the actual value, preserving type (number)', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { count: '{:count}' },
        });

        expect(emit.resolveBody({ count: 42 })).toEqual({ count: 42 });
      });

      it('splices the actual value, preserving type (nested object)', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { address: '{:address}' },
        });
        const address = { city: 'Springfield' };

        expect(emit.resolveBody({ address })).toEqual({ address });
      });

      it('splices the actual value, preserving type (array)', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { tags: '{:tags}' },
        });
        const tags = ['a', 'b'];

        expect(emit.resolveBody({ tags })).toEqual({ tags });
      });
    });

    describe('when the template uses the {:.} whole-token', () => {
      it('splices the entire item', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { wrapped: '{:.}' },
        });
        const item = { id: 1, name: 'Widget' };

        expect(emit.resolveBody(item)).toEqual({ wrapped: item });
      });
    });

    describe('when a token is embedded in a longer string', () => {
      it('interpolates the token, stringifying non-string values', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { note: 'note {:id} extracted' },
        });

        expect(emit.resolveBody({ id: 7 })).toEqual({ note: 'note 7 extracted' });
      });
    });

    describe('when the token path is missing/unresolvable', () => {
      it('returns the literal token for a whole-token value', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { missing: '{:missing}' },
        });

        expect(emit.resolveBody({ id: 1 })).toEqual({ missing: '{:missing}' });
      });

      it('leaves the literal token embedded in the surrounding string', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { note: 'note {:missing} extracted' },
        });

        expect(emit.resolveBody({ id: 1 })).toEqual({ note: 'note {:missing} extracted' });
      });
    });

    describe('when the template has a nested dot-path token', () => {
      it('resolves through nested objects', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: { city: '{:address.city}' },
        });

        expect(emit.resolveBody({ address: { city: 'Springfield' } })).toEqual({ city: 'Springfield' });
      });
    });

    describe('when the template has a nested structure', () => {
      it('recurses and renders every string leaf', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST',
          url: '/emit',
          body_template: {
            id: '{:id}',
            items: [{ name: '{:name}' }, { note: 'fixed {:id}' }],
          },
        });

        expect(emit.resolveBody({ id: 1, name: 'Widget' })).toEqual({
          id: 1,
          items: [{ name: 'Widget' }, { note: 'fixed 1' }],
        });
      });
    });

    describe('when the template has non-string leaf values', () => {
      it('passes numbers, booleans, and null through unchanged', () => {
        const emit = new ResourceRequestEmit({
          method: 'POST',
          url: '/emit',
          body_template: { count: 5, active: true, missing: null },
        });

        expect(emit.resolveBody({ id: 1 })).toEqual({ count: 5, active: true, missing: null });
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
