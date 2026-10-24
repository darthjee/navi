import path from 'path';
import { fileURLToPath } from 'url';
import { loadReleaseTree } from '../lib/loadReleaseTree.js';
import { packageJsonReader } from '../lib/readPackageJson.js';
import { validateReleaseTree } from '../lib/validateReleaseTree.js';

const entry = (folder, platform, dependsOn = [], tagPrefix) => (
  { folder, platform, dependsOn, tagPrefix }
);

const buildTree = () => ({
  packages: {
    'deku-sprout': entry('deku-sprout', 'npm', [], 'sprout-'),
    'deku-swarm': entry('worker', 'npm', [], 'swarm-'),
    'navi-hey': entry('source', 'npm', ['deku-sprout', 'deku-swarm']),
    'darthjee/navi-hey': entry('source', 'docker', ['navi-hey']),
    'navi-hey-client': entry('clients/node', 'npm', ['deku-sprout'], 'node_client-'),
    'darthjee/navi-hey-client': entry('clients/node', 'docker', ['navi-hey-client']),
  },
});

const buildPackageJsons = () => ({
  'deku-sprout': { name: 'deku-sprout' },
  worker: { name: 'deku-swarm' },
  source: {
    name: 'navi-hey',
    dependencies: { 'deku-sprout': 'file:../deku-sprout', 'deku-swarm': 'file:../worker', yaml: '^2.8.2' },
  },
  'clients/node': {
    name: 'navi-hey-client',
    dependencies: { 'deku-sprout': '^0.3.0' },
    devDependencies: { 'navi-spec-support': 'file:../../spec-support' },
  },
});

describe('validateReleaseTree', () => {
  let tree;
  let packageJsons;

  const reader = (folder) => packageJsons[folder] || null;
  const validate = () => validateReleaseTree(tree, reader);

  beforeEach(() => {
    tree = buildTree();
    packageJsons = buildPackageJsons();
  });

  describe('when everything matches', () => {
    it('returns no errors', () => {
      expect(validate()).toEqual([]);
    });
  });

  describe('when a declared local dependency is not listed', () => {
    beforeEach(() => {
      tree.packages['navi-hey'].dependsOn = ['deku-sprout'];
    });

    it('reports the missing dependency', () => {
      expect(validate()).toEqual([
        'navi-hey: declares deku-swarm but depends_on does not list it',
      ]);
    });
  });

  describe('when depends_on lists an undeclared dependency', () => {
    beforeEach(() => {
      tree.packages['navi-hey-client'].dependsOn = ['deku-sprout', 'deku-swarm'];
    });

    it('reports the extra dependency', () => {
      expect(validate()).toEqual([
        'navi-hey-client: depends_on lists deku-swarm but package.json does not declare it',
      ]);
    });
  });

  describe('when a dependency is declared as a peer dependency', () => {
    beforeEach(() => {
      packageJsons['deku-sprout'].peerDependencies = { 'deku-swarm': '^1.0.0' };
    });

    it('requires it to be listed', () => {
      expect(validate()).toEqual([
        'deku-sprout: declares deku-swarm but depends_on does not list it',
      ]);
    });
  });

  describe('when a folder has no package.json', () => {
    beforeEach(() => {
      tree.packages['deku-swarm'].folder = 'missing';
    });

    it('reports the folder', () => {
      expect(validate()).toEqual([
        "deku-swarm: folder 'missing' has no package.json",
      ]);
    });
  });

  describe('when an npm name does not match its key', () => {
    beforeEach(() => {
      packageJsons.worker.name = 'other-name';
    });

    it('reports the mismatch', () => {
      expect(validate()).toEqual([
        "deku-swarm: package.json name is 'other-name'",
      ]);
    });
  });

  describe('when a docker entry depends on the wrong package', () => {
    beforeEach(() => {
      tree.packages['darthjee/navi-hey'].dependsOn = ['navi-hey-client'];
    });

    it('reports the expected dependency', () => {
      expect(validate()).toEqual([
        'darthjee/navi-hey: depends_on must be exactly [navi-hey], got [navi-hey-client]',
      ]);
    });
  });

  describe('when a docker entry has extra dependencies', () => {
    beforeEach(() => {
      tree.packages['darthjee/navi-hey'].dependsOn = ['navi-hey', 'deku-sprout'];
    });

    it('reports the expected dependency', () => {
      expect(validate()).toEqual([
        'darthjee/navi-hey: depends_on must be exactly [navi-hey], got [navi-hey, deku-sprout]',
      ]);
    });
  });

  describe('when a docker entry has no npm sibling', () => {
    beforeEach(() => {
      tree.packages['darthjee/other'] = entry('worker2', 'docker', ['deku-swarm']);
      packageJsons.worker2 = { name: 'whatever' };
    });

    it('reports the missing sibling', () => {
      expect(validate()).toEqual([
        "darthjee/other: no npm entry lives in folder 'worker2'",
      ]);
    });
  });

  describe('when a docker entry folder has no package.json', () => {
    beforeEach(() => {
      tree.packages['darthjee/other'] = entry('nowhere', 'docker', []);
    });

    it('reports both the folder and the missing sibling', () => {
      expect(validate()).toEqual([
        "darthjee/other: folder 'nowhere' has no package.json",
        "darthjee/other: no npm entry lives in folder 'nowhere'",
      ]);
    });
  });

  describe('when a local package is only a devDependency', () => {
    beforeEach(() => {
      packageJsons.worker.devDependencies = { 'deku-sprout': 'file:../deku-sprout' };
    });

    it('ignores it', () => {
      expect(validate()).toEqual([]);
    });
  });

  describe('when several problems exist', () => {
    beforeEach(() => {
      packageJsons.worker.name = 'other-name';
      tree.packages['navi-hey'].dependsOn = [];
    });

    it('reports every one of them', () => {
      expect(validate().length).toEqual(3);
    });
  });

  describe('with the real repository', () => {
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

    it('has a release.yml in sync with every package.json', () => {
      const realTree = loadReleaseTree(rootDir);

      expect(validateReleaseTree(realTree, packageJsonReader(rootDir))).toEqual([]);
    });
  });
});
