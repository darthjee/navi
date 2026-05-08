import { EnvStringResolver } from '../../../../lib/utils/env_resolver/EnvStringResolver.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';

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
});
