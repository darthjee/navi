import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadReleaseTree } from '../lib/loadReleaseTree.js';

describe('loadReleaseTree', () => {
  let rootDir;

  const writeRelease = (content) => {
    fs.writeFileSync(path.join(rootDir, 'release.yml'), content);
  };

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-tree-'));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  describe('when the file is well formed', () => {
    beforeEach(() => {
      writeRelease([
        'packages:',
        '  pkg-a:',
        '    folder: a',
        '    platform: npm',
        '    depends_on: []',
        '    tag_prefix: a-',
        '  pkg-b:',
        '    folder: b',
        '    platform: npm',
        '    depends_on: [pkg-a]',
        '  img/pkg-b:',
        '    folder: b',
        '    platform: docker',
        '',
      ].join('\n'));
    });

    it('parses every entry', () => {
      expect(loadReleaseTree(rootDir)).toEqual({
        packages: {
          'pkg-a': { folder: 'a', platform: 'npm', dependsOn: [], tagPrefix: 'a-' },
          'pkg-b': { folder: 'b', platform: 'npm', dependsOn: ['pkg-a'], tagPrefix: undefined },
          'img/pkg-b': { folder: 'b', platform: 'docker', dependsOn: [], tagPrefix: undefined },
        },
      });
    });
  });

  describe('when an entry is empty', () => {
    beforeEach(() => {
      writeRelease('packages:\n  pkg-a:\n');
    });

    it('returns an empty entry', () => {
      expect(loadReleaseTree(rootDir).packages['pkg-a']).toEqual({
        folder: undefined, platform: undefined, dependsOn: [], tagPrefix: undefined,
      });
    });
  });

  describe('when the packages map is missing', () => {
    beforeEach(() => {
      writeRelease('other: value\n');
    });

    it('throws a clear error', () => {
      expect(() => loadReleaseTree(rootDir)).toThrowError(/missing 'packages' map/);
    });
  });

  describe('when the file is empty', () => {
    beforeEach(() => {
      writeRelease('');
    });

    it('throws a clear error', () => {
      expect(() => loadReleaseTree(rootDir)).toThrowError(/missing 'packages' map/);
    });
  });

  describe('when packages is a list', () => {
    beforeEach(() => {
      writeRelease('packages:\n  - a\n');
    });

    it('throws a clear error', () => {
      expect(() => loadReleaseTree(rootDir)).toThrowError(/missing 'packages' map/);
    });
  });
});
