import { EnvStringResolver } from '../../../../lib/utils/env_resolver/EnvStringResolver.js';

describe('EnvStringResolver', () => {
  describe('.resolve', () => {
    describe('when the environment variable is defined', () => {
      beforeEach(() => {
        process.env.STR_ENV_VAR = 'yaml-value';
      });

      afterEach(() => {
        delete process.env.STR_ENV_VAR;
      });

      it('replaces $VAR_NAME syntax in a raw string', () => {
        expect(EnvStringResolver.resolve('key: $STR_ENV_VAR')).toBe('key: yaml-value');
      });

      it('replaces ${VAR_NAME} syntax in a raw string', () => {
        expect(EnvStringResolver.resolve('key: ${STR_ENV_VAR}')).toBe('key: yaml-value');
      });

      it('replaces the variable within a larger string', () => {
        expect(EnvStringResolver.resolve('prefix-$STR_ENV_VAR-suffix'))
          .toBe('prefix-yaml-value-suffix');
      });
    });

    describe('when the environment variable is not defined', () => {
      beforeEach(() => {
        delete process.env.MISSING_STR_VAR;
        spyOn(console, 'warn');
      });

      it('replaces with an empty string', () => {
        expect(EnvStringResolver.resolve('key: $MISSING_STR_VAR')).toBe('key: ');
      });

      it('warns about the missing variable', () => {
        EnvStringResolver.resolve('$MISSING_STR_VAR');
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('MISSING_STR_VAR')
        );
      });
    });

    it('coerces non-string values to string', () => {
      expect(EnvStringResolver.resolve(42)).toBe('42');
    });
  });
});
