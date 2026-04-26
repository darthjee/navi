import path from 'path';
import { PathValidator } from '../../../lib/server/PathValidator.js';

describe('PathValidator', () => {
  const baseDir = path.resolve('/var/app/static/assets');
  let validator;

  beforeEach(() => {
    validator = new PathValidator(baseDir);
  });

  describe('#isValid', () => {
    describe('when the resolved path is inside the base directory', () => {
      it('returns true', () => {
        const result = validator.isValid(path.join(baseDir, 'app.js'));
        expect(result).toBe(true);
      });

      it('returns true for nested paths', () => {
        const result = validator.isValid(path.join(baseDir, 'vendor', 'lib.js'));
        expect(result).toBe(true);
      });
    });

    describe('when the resolved path escapes the base directory', () => {
      it('returns false for path traversal', () => {
        const result = validator.isValid(path.resolve(baseDir, '../secret.txt'));
        expect(result).toBe(false);
      });

      it('returns false for the base directory itself', () => {
        const result = validator.isValid(baseDir);
        expect(result).toBe(false);
      });
    });
  });

  describe('#validate', () => {
    describe('when the resolved path is inside the base directory', () => {
      it('does not throw', () => {
        expect(() => validator.validate(path.join(baseDir, 'app.js'))).not.toThrow();
      });
    });

    describe('when the resolved path escapes the base directory', () => {
      it('throws an error for path traversal', () => {
        expect(() => validator.validate(path.resolve(baseDir, '../secret.txt'))).toThrow();
      });

      it('throws an error for the base directory itself', () => {
        expect(() => validator.validate(baseDir)).toThrow();
      });
    });
  });
});
