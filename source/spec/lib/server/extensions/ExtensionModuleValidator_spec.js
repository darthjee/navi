import { ExtensionModuleValidator } from '../../../../lib/server/extensions/ExtensionModuleValidator.js';

describe('ExtensionModuleValidator', () => {
  class HandlerA {}
  class HandlerB {}

  describe('.validate', () => {
    describe('with a valid default export array', () => {
      const moduleNamespace = {
        default: [
          { method: 'GET', path: '/a', handler: HandlerA },
          { method: 'post', path: '/b', handler: HandlerB },
        ],
      };

      it('returns the normalised descriptors', () => {
        const { descriptors } = ExtensionModuleValidator.validate(moduleNamespace);

        expect(descriptors).toEqual([
          { method: 'GET', path: '/a', handler: HandlerA },
          { method: 'POST', path: '/b', handler: HandlerB },
        ]);
      });

      it('returns no errors', () => {
        expect(ExtensionModuleValidator.validate(moduleNamespace).errors).toEqual([]);
      });
    });

    describe('with a valid routes named export', () => {
      const moduleNamespace = {
        routes: [{ method: 'patch', path: '/x', handler: HandlerA }],
      };

      it('reads from routes', () => {
        const { descriptors } = ExtensionModuleValidator.validate(moduleNamespace);

        expect(descriptors).toEqual([{ method: 'PATCH', path: '/x', handler: HandlerA }]);
      });
    });

    describe('when both default and routes are present', () => {
      const moduleNamespace = {
        default: [{ method: 'GET', path: '/from-default', handler: HandlerA }],
        routes: [{ method: 'GET', path: '/from-routes', handler: HandlerB }],
      };

      it('default wins', () => {
        const { descriptors } = ExtensionModuleValidator.validate(moduleNamespace);

        expect(descriptors).toEqual([{ method: 'GET', path: '/from-default', handler: HandlerA }]);
      });
    });

    describe('when neither export is an array', () => {
      it('returns a single error and no descriptors', () => {
        const result = ExtensionModuleValidator.validate({ default: {} });

        expect(result.descriptors).toEqual([]);
        expect(result.errors).toEqual([
          "neither a default export nor a 'routes' export is an array",
        ]);
      });
    });

    describe('individual rejection reasons', () => {
      it('rejects a non-object entry', () => {
        const { errors } = ExtensionModuleValidator.validate({ default: ['nope'] });

        expect(errors).toEqual(['descriptor 0 is not an object']);
      });

      it('rejects an unsupported method', () => {
        const { errors } = ExtensionModuleValidator.validate({
          default: [{ method: 'DELETE', path: '/a', handler: HandlerA }],
        });

        expect(errors).toEqual(['descriptor 0 has unsupported method "DELETE"']);
      });

      it('rejects a missing method', () => {
        const { errors } = ExtensionModuleValidator.validate({
          default: [{ path: '/a', handler: HandlerA }],
        });

        expect(errors).toEqual(['descriptor 0 has unsupported method "undefined"']);
      });

      it('rejects an empty path', () => {
        const { errors } = ExtensionModuleValidator.validate({
          default: [{ method: 'GET', path: '', handler: HandlerA }],
        });

        expect(errors).toEqual(['descriptor 0 has an invalid path ""']);
      });

      it('rejects a path that is not slash-prefixed', () => {
        const { errors } = ExtensionModuleValidator.validate({
          default: [{ method: 'GET', path: 'a', handler: HandlerA }],
        });

        expect(errors).toEqual(['descriptor 0 has an invalid path "a"']);
      });

      it('rejects a path with whitespace', () => {
        const { errors } = ExtensionModuleValidator.validate({
          default: [{ method: 'GET', path: '/a b', handler: HandlerA }],
        });

        expect(errors).toEqual(['descriptor 0 has an invalid path "/a b"']);
      });

      it('rejects a handler that is not a function', () => {
        const { errors } = ExtensionModuleValidator.validate({
          default: [{ method: 'GET', path: '/a', handler: {} }],
        });

        expect(errors).toEqual(['descriptor 0 handler is not a class']);
      });
    });

    describe('with a mix of valid and invalid entries', () => {
      const moduleNamespace = {
        default: [
          { method: 'GET', path: '/good', handler: HandlerA },
          { method: 'DELETE', path: '/bad', handler: HandlerB },
          { method: 'POST', path: '/good2', handler: HandlerB },
        ],
      };

      it('keeps the valid descriptors', () => {
        const { descriptors } = ExtensionModuleValidator.validate(moduleNamespace);

        expect(descriptors).toEqual([
          { method: 'GET', path: '/good', handler: HandlerA },
          { method: 'POST', path: '/good2', handler: HandlerB },
        ]);
      });

      it('reports the invalid entry', () => {
        const { errors } = ExtensionModuleValidator.validate(moduleNamespace);

        expect(errors).toEqual(['descriptor 1 has unsupported method "DELETE"']);
      });
    });
  });
});
