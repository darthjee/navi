import { describePackage } from '../lib/describePackage.js';

describe('describePackage', () => {
  const tree = {
    packages: {
      'pkg-a': { folder: 'a', platform: 'npm', dependsOn: [], tagPrefix: 'a-' },
      'pkg-b': { folder: 'b', platform: 'npm', dependsOn: ['pkg-a'], tagPrefix: undefined },
    },
  };

  describe('when the package has a tag prefix and no dependencies', () => {
    it('returns its release data', () => {
      expect(describePackage(tree, 'pkg-a')).toEqual({
        name: 'pkg-a', folder: 'a', platform: 'npm', tagPrefix: 'a-', dependsOn: [],
      });
    });
  });

  describe('when the package has dependencies and no tag prefix', () => {
    it('returns its release data', () => {
      expect(describePackage(tree, 'pkg-b')).toEqual({
        name: 'pkg-b', folder: 'b', platform: 'npm', tagPrefix: undefined, dependsOn: ['pkg-a'],
      });
    });
  });

  describe('when the package is unknown', () => {
    it('throws a clear error', () => {
      expect(() => describePackage(tree, 'pkg-c')).toThrowError(/unknown package 'pkg-c'/);
    });
  });

  describe('when the name is an inherited property', () => {
    it('throws a clear error', () => {
      expect(() => describePackage(tree, 'toString')).toThrowError(/unknown package 'toString'/);
    });
  });
});
