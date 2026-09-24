import { ResourceRequestEmit } from '../../../../../lib/models/request/resource_request/ResourceRequestEmit.js';

describe('ResourceRequestEmit', () => {
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
});
