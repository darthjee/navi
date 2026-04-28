import { EnvResolver } from '../../../lib/utils/EnvResolver.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('EnvResolver', () => {
  describe('.resolveValue', () => {
    describe('when value has no env var references', () => {
      it('returns the value unchanged', () => {
        expect(EnvResolver.resolveValue('static-value')).toEqual('static-value');
      });
    });

    describe('when value references an env var with $VAR syntax', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'secret-token-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('resolves the variable from process.env', () => {
        expect(EnvResolver.resolveValue('Bearer $NAVI_TEST_TOKEN'))
          .toEqual('Bearer secret-token-value');
      });
    });

    describe('when value references an env var with ${VAR} syntax', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'secret-token-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('resolves the variable from process.env', () => {
        expect(EnvResolver.resolveValue('Bearer ${NAVI_TEST_TOKEN}'))
          .toEqual('Bearer secret-token-value');
      });
    });

    describe('when value is only a variable reference', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'secret-token-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('resolves to the variable value', () => {
        expect(EnvResolver.resolveValue('$NAVI_TEST_TOKEN'))
          .toEqual('secret-token-value');
      });
    });

    describe('when the referenced env var is not set', () => {
      it('replaces the reference with an empty string and logs a warning', () => {
        spyOn(Logger, 'warn').and.stub();

        expect(EnvResolver.resolveValue('Bearer $NAVI_UNDEFINED_VAR'))
          .toEqual('Bearer ');
        expect(Logger.warn).toHaveBeenCalledWith(
          'Environment variable not defined: NAVI_UNDEFINED_VAR'
        );
      });
    });

    describe('when value is a number', () => {
      it('coerces it to a string', () => {
        expect(EnvResolver.resolveValue(42)).toEqual('42');
      });
    });

    describe('when value is a boolean', () => {
      it('coerces it to a string', () => {
        expect(EnvResolver.resolveValue(true)).toEqual('true');
      });
    });
  });

  describe('.resolveObject', () => {
    describe('when object has static values', () => {
      it('returns values unchanged', () => {
        const input = { 'X-Api-Key': 'abc123', 'Accept': 'application/json' };

        expect(EnvResolver.resolveObject(input)).toEqual(input);
      });
    });

    describe('when object has env var references', () => {
      beforeEach(() => {
        process.env.NAVI_TEST_TOKEN = 'resolved-value';
      });

      afterEach(() => {
        delete process.env.NAVI_TEST_TOKEN;
      });

      it('resolves env vars in all values', () => {
        const input = {
          Authorization: 'Bearer $NAVI_TEST_TOKEN',
          'X-Static': 'unchanged',
        };

        expect(EnvResolver.resolveObject(input)).toEqual({
          Authorization: 'Bearer resolved-value',
          'X-Static': 'unchanged',
        });
      });
    });

    describe('when object is empty', () => {
      it('returns an empty object', () => {
        expect(EnvResolver.resolveObject({})).toEqual({});
      });
    });
  });

  describe('.resolveString', () => {
    describe('when the string has no env var references', () => {
      it('returns the string unchanged', () => {
        expect(EnvResolver.resolveString('no vars here')).toEqual('no vars here');
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
        expect(EnvResolver.resolveString('Bearer $NAVI_TEST_TOKEN'))
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
        expect(EnvResolver.resolveString('Bearer ${NAVI_TEST_TOKEN}'))
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
        expect(EnvResolver.resolveString('https://$NAVI_TEST_HOST\ntoken: $NAVI_TEST_TOKEN'))
          .toEqual('https://example.com\ntoken: my-token');
      });
    });

    describe('when the referenced env var is not set', () => {
      it('replaces the reference with an empty string and logs a warning', () => {
        spyOn(Logger, 'warn').and.stub();

        expect(EnvResolver.resolveString('Bearer $NAVI_UNDEFINED_VAR'))
          .toEqual('Bearer ');
        expect(Logger.warn).toHaveBeenCalledWith(
          'Environment variable not defined: NAVI_UNDEFINED_VAR'
        );
      });
    });
  });
});
