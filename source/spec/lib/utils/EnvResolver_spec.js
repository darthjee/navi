import { EnvResolver } from '../../../lib/utils/EnvResolver.js';

describe('EnvResolver', () => {
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
});
