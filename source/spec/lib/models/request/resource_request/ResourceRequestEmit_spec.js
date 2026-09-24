import { InvalidEmitBodyTemplate } from '../../../../../lib/exceptions/config/emit/InvalidEmitBodyTemplate.js';
import { InvalidEmitCooldown } from '../../../../../lib/exceptions/config/emit/InvalidEmitCooldown.js';
import { InvalidEmitHeaders } from '../../../../../lib/exceptions/config/emit/InvalidEmitHeaders.js';
import { InvalidEmitMethod } from '../../../../../lib/exceptions/config/emit/InvalidEmitMethod.js';
import { InvalidEmitRetries } from '../../../../../lib/exceptions/config/emit/InvalidEmitRetries.js';
import { MissingEmitUrl } from '../../../../../lib/exceptions/config/emit/MissingEmitUrl.js';
import { ResourceRequestEmit } from '../../../../../lib/models/request/resource_request/ResourceRequestEmit.js';

const build = (attrs) => new ResourceRequestEmit({ method: 'POST', url: '/emit', ...attrs });

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

    [
      { attr: 'retries', error: InvalidEmitRetries, positive: 5, nonNumeric: 'five' },
      { attr: 'cooldown', error: InvalidEmitCooldown, positive: 5000, nonNumeric: 'five thousand' },
    ].forEach(({ attr, error, positive, nonNumeric }) => {
      describe(attr, () => {
        describe('when not given', () => {
          it('exposes undefined', () => {
            expect(build({})[attr]).toBeUndefined();
          });
        });

        describe('when given a positive number', () => {
          it('exposes the configured value', () => {
            expect(build({ [attr]: positive })[attr]).toBe(positive);
          });
        });

        describe('when given 0', () => {
          it('accepts it as a valid value', () => {
            expect(build({ [attr]: 0 })[attr]).toBe(0);
          });
        });

        describe('when given a negative number', () => {
          it(`throws ${error.name}`, () => {
            expect(() => build({ [attr]: -1 }))
              .toThrowMatching((thrown) => thrown instanceof error);
          });
        });

        describe('when given a non-numeric value', () => {
          it(`throws ${error.name}`, () => {
            expect(() => build({ [attr]: nonNumeric }))
              .toThrowMatching((thrown) => thrown instanceof error);
          });
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

      [
        { description: 'an array', value: ['a', 'b'] },
        { description: 'a non-object primitive', value: 'nope' },
        { description: 'an object with a nested-object value', value: { X: { nested: 1 } } },
      ].forEach(({ description, value }) => {
        describe(`when given ${description}`, () => {
          it('throws InvalidEmitHeaders', () => {
            expect(() => build({ headers: value }))
              .toThrowMatching((error) => error instanceof InvalidEmitHeaders);
          });
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

      class SomeClass {}

      [
        { description: 'a string', value: 'nope' },
        { description: 'a number', value: 42 },
        { description: 'null explicitly', value: null },
        { description: 'a non-plain object (a class instance)', value: new SomeClass() },
      ].forEach(({ description, value }) => {
        describe(`when given ${description}`, () => {
          it('throws InvalidEmitBodyTemplate', () => {
            expect(() => build({ body_template: value }))
              .toThrowMatching((error) => error instanceof InvalidEmitBodyTemplate);
          });
        });
      });
    });
  });

  describe('#disabled', () => {
    [
      { description: 'when neither enabled nor disabled is given', attrs: {}, expected: false },
      { description: 'when enabled is true', attrs: { enabled: true }, expected: false },
      { description: 'when enabled is false', attrs: { enabled: false }, expected: true },
      { description: 'when enabled is true and disabled is not given', attrs: { enabled: true }, expected: false },
      { description: 'when disabled is true', attrs: { disabled: true }, expected: true },
      { description: 'when disabled is false', attrs: { disabled: false }, expected: false },
      { description: 'when disabled is true and enabled is not given', attrs: { disabled: true }, expected: true },
      {
        description: 'when enabled is true and disabled is true (disabled wins)',
        attrs: { enabled: true, disabled: true },
        expected: true,
      },
      {
        description: 'when enabled is true and disabled is false',
        attrs: { enabled: true, disabled: false },
        expected: false,
      },
      {
        description: 'when enabled is false and disabled is true',
        attrs: { enabled: false, disabled: true },
        expected: true,
      },
      {
        description: 'when enabled is false and disabled is false',
        attrs: { enabled: false, disabled: false },
        expected: true,
      },
    ].forEach(({ description, attrs, expected }) => {
      it(`returns ${expected} ${description}`, () => {
        const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', ...attrs });

        expect(emit.disabled).toBe(expected);
      });
    });

    describe('when enabled/disabled are given non-boolean values', () => {
      [
        { description: 'enabled is null', attrs: { enabled: null } },
        { description: 'enabled is an empty string', attrs: { enabled: '' } },
        { description: 'enabled is an arbitrary string', attrs: { enabled: 'false' } },
        { description: 'disabled is null', attrs: { disabled: null } },
        { description: 'disabled is an empty string', attrs: { disabled: '' } },
        { description: 'disabled is an arbitrary string', attrs: { disabled: 'true' } },
      ].forEach(({ description, attrs }) => {
        it(`does not trip either check when ${description}`, () => {
          const emit = new ResourceRequestEmit({ method: 'POST', url: '/emit', ...attrs });

          expect(emit.disabled).toBe(false);
        });
      });
    });

    describe('validation of method/url/headers/body_template', () => {
      it('still throws MissingEmitUrl when url is missing, regardless of disabled: true', () => {
        expect(() => new ResourceRequestEmit({ method: 'POST', disabled: true }))
          .toThrowMatching((error) => error instanceof MissingEmitUrl);
      });

      it('still throws InvalidEmitMethod when method is invalid, regardless of enabled: false', () => {
        expect(() => new ResourceRequestEmit({ method: 'GET', url: '/emit', enabled: false }))
          .toThrowMatching((error) => error instanceof InvalidEmitMethod);
      });

      it('still throws InvalidEmitHeaders when headers are invalid, regardless of disabled: true', () => {
        expect(() => new ResourceRequestEmit({
          method: 'POST', url: '/emit', headers: 'nope', disabled: true,
        })).toThrowMatching((error) => error instanceof InvalidEmitHeaders);
      });

      it('still throws InvalidEmitBodyTemplate when body_template is invalid, regardless of enabled: false', () => {
        expect(() => new ResourceRequestEmit({
          method: 'POST', url: '/emit', body_template: 'nope', enabled: false,
        })).toThrowMatching((error) => error instanceof InvalidEmitBodyTemplate);
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
