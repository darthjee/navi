import { EnvStringResolver } from '../../lib/EnvStringResolver.js';

describe('EnvStringResolver', () => {
  const ENV_VAR = 'NAVI_CLIENT_SPEC_ENV_VAR';

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  describe('.resolve', () => {
    it('resolves $VAR bare references', () => {
      process.env[ENV_VAR] = 'bare-value';

      expect(EnvStringResolver.resolve(`token: $${ENV_VAR}`)).toBe('token: bare-value');
    });

    it('resolves ${VAR} braced references', () => {
      process.env[ENV_VAR] = 'braced-value';

      expect(EnvStringResolver.resolve(`token: \${${ENV_VAR}}`)).toBe('token: braced-value');
    });

    it('resolves a missing variable to an empty string', () => {
      spyOn(console, 'warn');

      expect(EnvStringResolver.resolve(`token: \${${ENV_VAR}}`)).toBe('token: ');
      expect(console.warn).toHaveBeenCalledWith(`Environment variable not defined: ${ENV_VAR}`);
    });

    it('leaves strings without env var references untouched', () => {
      expect(EnvStringResolver.resolve('namespace: reports')).toBe('namespace: reports');
    });

    it('resolves multiple references in the same string', () => {
      process.env[ENV_VAR] = 'value';

      expect(EnvStringResolver.resolve(`a: $${ENV_VAR}, b: \${${ENV_VAR}}`)).toBe('a: value, b: value');
    });
  });
});
