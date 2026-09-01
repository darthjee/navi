import { createHash } from 'node:crypto';
import { EnvStringResolver } from '../../../../../lib/common/utils/env_resolver/EnvStringResolver.js';
import { Logger } from '../../../../../lib/common/utils/logging/Logger.js';

describe('EnvStringResolver', () => {
  describe('.resolve', () => {
    describe('when the string has no env var references', () => {
      it('returns the string unchanged', () => {
        expect(EnvStringResolver.resolve('no vars here')).toEqual('no vars here');
      });
    });

    describe('when the string contains $VAR syntax', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'resolved-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('replaces the reference with the env var value', () => {
        expect(EnvStringResolver.resolve('Bearer $NAVI_TEST_TOKEN'))
          .toEqual('Bearer resolved-value');
      });
    });

    describe('when the string contains ${VAR} syntax', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'resolved-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('replaces the reference with the env var value', () => {
        expect(EnvStringResolver.resolve('Bearer ${NAVI_TEST_TOKEN}'))
          .toEqual('Bearer resolved-value');
      });
    });

    describe('when the string contains multiple env var references', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_HOST = 'example.com';
        process.env.NAVI_TEST_TOKEN = 'my-token';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_HOST;
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('replaces all references', () => {
        expect(EnvStringResolver.resolve('https://$NAVI_TEST_HOST\ntoken: $NAVI_TEST_TOKEN'))
          .toEqual('https://example.com\ntoken: my-token');
      });
    });

    describe('when the referenced env var is not set', () => {
      it('replaces the reference with an empty string and logs a warning', () => {
        spyOn(Logger, 'warn').and.stub();

        expect(EnvStringResolver.resolve('Bearer $NAVI_UNDEFINED_VAR'))
          .toEqual('Bearer ');
        expect(Logger.warn).toHaveBeenCalledWith(
          'Environment variable not defined: NAVI_UNDEFINED_VAR'
        );
      });
    });

    describe('when value is a number', () => {
      it('coerces it to a string', () => {
        expect(EnvStringResolver.resolve(42)).toEqual('42');
      });
    });

    describe('when value is a boolean', () => {
      it('coerces it to a string', () => {
        expect(EnvStringResolver.resolve(true)).toEqual('true');
      });
    });
  });

  describe('#resolve', () => {
    const ENV_VAR = 'NAVI_TEST_MATCH_VAR';

    afterEach(() => {
      delete process.env[ENV_VAR];
    });

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
        spyOn(Logger, 'warn').and.stub();

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
