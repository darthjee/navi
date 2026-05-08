import { EnvResolver } from '../../../lib/utils/EnvResolver.js';

describe('EnvResolver', () => {
  describe('.resolveString', () => {
    describe('when the environment variable is defined', () => {
      beforeEach(() => {
        process.env.STR_ENV_VAR = 'yaml-value';
      });

      afterEach(() => {
        delete process.env.STR_ENV_VAR;
      });

      it('replaces $VAR_NAME syntax in a raw string', () => {
        expect(EnvResolver.resolveString('key: $STR_ENV_VAR')).toBe('key: yaml-value');
      });

      it('replaces ${VAR_NAME} syntax in a raw string', () => {
        expect(EnvResolver.resolveString('key: ${STR_ENV_VAR}')).toBe('key: yaml-value');
      });

      it('replaces the variable within a larger string', () => {
        expect(EnvResolver.resolveString('prefix-$STR_ENV_VAR-suffix'))
          .toBe('prefix-yaml-value-suffix');
      });
    });

    describe('when the environment variable is not defined', () => {
      beforeEach(() => {
        delete process.env.MISSING_STR_VAR;
        spyOn(console, 'warn');
      });

      it('replaces with an empty string', () => {
        expect(EnvResolver.resolveString('key: $MISSING_STR_VAR')).toBe('key: ');
      });

      it('warns about the missing variable', () => {
        EnvResolver.resolveString('$MISSING_STR_VAR');
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('MISSING_STR_VAR')
        );
      });
    });

    it('coerces non-string values to string', () => {
      expect(EnvResolver.resolveString(42)).toBe('42');
    });
  });

  describe('.resolveObject', () => {
    beforeEach(() => {
      process.env.OBJ_VAR = 'world';
    });

    afterEach(() => {
      delete process.env.OBJ_VAR;
    });

    it('resolves env var references in all object values', () => {
      const result = EnvResolver.resolveObject({ key: '$OBJ_VAR', other: 'plain' });
      expect(result).toEqual({ key: 'world', other: 'plain' });
    });

    it('returns a new object without mutating the original', () => {
      const original = { key: '$OBJ_VAR' };
      EnvResolver.resolveObject(original);
      expect(original.key).toBe('$OBJ_VAR');
    });
  });
});
