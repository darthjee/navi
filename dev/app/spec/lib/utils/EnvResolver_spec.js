import { EnvResolver } from '../../../lib/utils/EnvResolver.js';

describe('EnvResolver', () => {
  describe('.resolveValue', () => {
    describe('when the environment variable is defined', () => {
      beforeEach(() => {
        process.env.TEST_ENV_VAR = 'hello';
      });

      afterEach(() => {
        delete process.env.TEST_ENV_VAR;
      });

      it('replaces $VAR_NAME syntax', () => {
        expect(EnvResolver.resolveValue('$TEST_ENV_VAR')).toBe('hello');
      });

      it('replaces ${VAR_NAME} syntax', () => {
        expect(EnvResolver.resolveValue('${TEST_ENV_VAR}')).toBe('hello');
      });

      it('replaces the variable within a larger string', () => {
        expect(EnvResolver.resolveValue('prefix_$TEST_ENV_VAR_suffix'))
          .toBe('prefix_hello_suffix');
      });
    });

    describe('when the environment variable is not defined', () => {
      beforeEach(() => {
        delete process.env.MISSING_VAR;
        spyOn(console, 'warn');
      });

      it('replaces with an empty string', () => {
        expect(EnvResolver.resolveValue('$MISSING_VAR')).toBe('');
      });

      it('warns about the missing variable', () => {
        EnvResolver.resolveValue('$MISSING_VAR');
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('MISSING_VAR')
        );
      });
    });

    it('returns non-string values coerced to string', () => {
      expect(EnvResolver.resolveValue(42)).toBe('42');
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
