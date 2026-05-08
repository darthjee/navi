import { EnvResolver } from '../../../lib/utils/EnvResolver.js';

describe('EnvResolver', () => {
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
