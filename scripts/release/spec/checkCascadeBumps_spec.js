import { checkCascadeBumps } from '../lib/checkCascadeBumps.js';

const entry = (folder, platform, dependsOn = [], tagPrefix) => (
  { folder, platform, dependsOn, tagPrefix }
);

const buildTree = () => ({
  packages: {
    'deku-sprout': entry('logger', 'npm', [], 'sprout-'),
    'deku-swarm': entry('worker', 'npm', [], 'swarm-'),
    'navi-hey': entry('source', 'npm', ['deku-sprout', 'deku-swarm']),
    'darthjee/navi-hey': entry('source', 'docker', ['navi-hey']),
    'navi-hey-client': entry('clients/node', 'npm', ['deku-sprout'], 'node_client-'),
    'darthjee/navi-hey-client': entry('clients/node', 'docker', ['navi-hey-client']),
  },
});

const buildVersions = () => ({
  'deku-sprout': '0.3.0',
  'deku-swarm': '0.2.0',
  'navi-hey': '1.0.0',
  'navi-hey-client': '0.5.0',
});

describe('checkCascadeBumps', () => {
  let tree;
  let baseVersions;
  let headVersions;

  const check = () => checkCascadeBumps(tree, baseVersions, headVersions);

  beforeEach(() => {
    tree = buildTree();
    baseVersions = buildVersions();
    headVersions = buildVersions();
  });

  describe('when nothing was bumped', () => {
    it('returns no errors', () => {
      expect(check()).toEqual([]);
    });
  });

  describe('when only deku-sprout was bumped', () => {
    beforeEach(() => {
      headVersions['deku-sprout'] = '0.4.0';
    });

    it('requires navi-hey and navi-hey-client bumps', () => {
      expect(check()).toEqual([
        'navi-hey must be bumped because deku-sprout changed 0.3.0 -> 0.4.0',
        'navi-hey-client must be bumped because deku-sprout changed 0.3.0 -> 0.4.0',
      ]);
    });
  });

  describe('when deku-sprout and both its dependents were bumped', () => {
    beforeEach(() => {
      headVersions['deku-sprout'] = '0.4.0';
      headVersions['navi-hey'] = '1.0.1';
      headVersions['navi-hey-client'] = '0.5.1';
    });

    it('returns no errors', () => {
      expect(check()).toEqual([]);
    });
  });

  describe('when only deku-swarm was bumped', () => {
    beforeEach(() => {
      headVersions['deku-swarm'] = '0.3.0';
    });

    it('requires a navi-hey bump only', () => {
      expect(check()).toEqual([
        'navi-hey must be bumped because deku-swarm changed 0.2.0 -> 0.3.0',
      ]);
    });
  });

  describe('when both deku-sprout and deku-swarm were bumped alone', () => {
    beforeEach(() => {
      headVersions['deku-sprout'] = '0.4.0';
      headVersions['deku-swarm'] = '0.3.0';
    });

    it('names each bumped dependency', () => {
      expect(check()).toEqual([
        'navi-hey must be bumped because deku-sprout changed 0.3.0 -> 0.4.0',
        'navi-hey must be bumped because deku-swarm changed 0.2.0 -> 0.3.0',
        'navi-hey-client must be bumped because deku-sprout changed 0.3.0 -> 0.4.0',
      ]);
    });
  });

  describe('when only navi-hey-client was bumped', () => {
    beforeEach(() => {
      headVersions['navi-hey-client'] = '0.6.0';
    });

    it('returns no errors', () => {
      expect(check()).toEqual([]);
    });
  });

  describe('when a package is missing at the base ref', () => {
    beforeEach(() => {
      delete baseVersions['deku-sprout'];
    });

    it('never triggers a cascade', () => {
      expect(check()).toEqual([]);
    });
  });

  describe('when a dependent is missing at the base ref', () => {
    beforeEach(() => {
      headVersions['deku-swarm'] = '0.3.0';
      delete baseVersions['navi-hey'];
    });

    it('counts it as not bumped', () => {
      expect(check()).toEqual([
        'navi-hey must be bumped because deku-swarm changed 0.2.0 -> 0.3.0',
      ]);
    });
  });

  describe('with a transitive chain', () => {
    beforeEach(() => {
      tree = {
        packages: {
          a: entry('a', 'npm'),
          b: entry('b', 'npm', ['a']),
          c: entry('c', 'npm', ['b']),
          'darthjee/c': entry('c', 'docker', ['c']),
        },
      };
      baseVersions = { a: '1.0.0', b: '1.0.0', c: '1.0.0' };
      headVersions = { a: '1.1.0', b: '1.0.0', c: '1.0.0' };
    });

    it('requires every transitive dependent, naming the original bump', () => {
      expect(check()).toEqual([
        'b must be bumped because a changed 1.0.0 -> 1.1.0',
        'c must be bumped because a changed 1.0.0 -> 1.1.0',
      ]);
    });

    describe('when the intermediate package was bumped', () => {
      beforeEach(() => {
        headVersions.b = '1.0.1';
      });

      it('still requires the end of the chain, once per bumped dependency', () => {
        expect(check()).toEqual([
          'c must be bumped because a changed 1.0.0 -> 1.1.0',
          'c must be bumped because b changed 1.0.0 -> 1.0.1',
        ]);
      });
    });
  });

  describe('docker entries', () => {
    beforeEach(() => {
      headVersions['deku-sprout'] = '0.4.0';
    });

    it('never appear in errors', () => {
      check().forEach((error) => {
        expect(error).not.toContain('darthjee/');
      });
    });
  });
});
