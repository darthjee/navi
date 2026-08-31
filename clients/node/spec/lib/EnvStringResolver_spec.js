import { createHash } from 'node:crypto';
import { EnvStringResolver } from '../../lib/EnvStringResolver.js';
import { Logger } from '../../lib/logging/Logger.js';

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
      spyOn(Logger, 'warn');

      expect(EnvStringResolver.resolve(`token: \${${ENV_VAR}}`)).toBe('token: ');
      expect(Logger.warn).toHaveBeenCalledWith(`Environment variable not defined: ${ENV_VAR}`);
    });

    it('leaves strings without env var references untouched', () => {
      expect(EnvStringResolver.resolve('namespace: reports')).toBe('namespace: reports');
    });

    it('resolves multiple references in the same string', () => {
      process.env[ENV_VAR] = 'value';

      expect(EnvStringResolver.resolve(`a: $${ENV_VAR}, b: \${${ENV_VAR}}`)).toBe('a: value, b: value');
    });
  });

  describe('#resolve', () => {
    describe('matches', () => {
      it('records a set var as defined, with length and hash', () => {
        process.env[ENV_VAR] = 'a-value';
        const expectedHash = createHash('sha256').update('a-value').digest('hex').slice(0, 12);

        const resolver = new EnvStringResolver(`token: $${ENV_VAR}`);
        resolver.resolve();

        expect(resolver.matches).toEqual([
          { varName: ENV_VAR, defined: true, length: 7, hash: expectedHash },
        ]);
      });

      it('records a set-but-empty var as defined, with length 0', () => {
        process.env[ENV_VAR] = '';

        const resolver = new EnvStringResolver(`token: $${ENV_VAR}`);
        resolver.resolve();

        expect(resolver.matches).toEqual([
          jasmine.objectContaining({ varName: ENV_VAR, defined: true, length: 0 }),
        ]);
      });

      it('records an unset var as not defined, without length or hash', () => {
        spyOn(Logger, 'warn');

        const resolver = new EnvStringResolver(`token: $${ENV_VAR}`);
        resolver.resolve();

        expect(resolver.matches).toEqual([{ varName: ENV_VAR, defined: false }]);
      });

      it('records one entry per occurrence (not deduped)', () => {
        process.env[ENV_VAR] = 'value';

        const resolver = new EnvStringResolver(`a: $${ENV_VAR}, b: \${${ENV_VAR}}`);
        resolver.resolve();

        expect(resolver.matches.length).toBe(2);
        expect(resolver.matches[0].varName).toBe(ENV_VAR);
        expect(resolver.matches[1].varName).toBe(ENV_VAR);
      });

      it('hashes the same value deterministically', () => {
        process.env[ENV_VAR] = 'stable-value';

        const first = new EnvStringResolver(`$${ENV_VAR}`);
        first.resolve();
        const second = new EnvStringResolver(`$${ENV_VAR}`);
        second.resolve();

        expect(first.matches[0].hash).toBe(second.matches[0].hash);
      });

      it('starts empty for a fresh instance', () => {
        const resolver = new EnvStringResolver('namespace: reports');

        expect(resolver.matches).toEqual([]);
      });
    });
  });
});
