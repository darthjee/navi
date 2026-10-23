import path from 'path';
import { fileURLToPath } from 'url';
import { collectVersions, gitRunner, readVersionAt, resolveBaseRef } from '../lib/git.js';

const failure = () => {
  throw new Error('git failed');
};

const fakeGit = (responses) => (args) => {
  const response = responses[args.join(' ')];

  return typeof response === 'function' ? response() : response;
};

describe('git helpers', () => {
  describe('resolveBaseRef', () => {
    const describeArgs = 'describe --tags --abbrev=0 --match=[0-9]*.[0-9]*.[0-9]* HEAD^';

    describe('on a tag with a previous X.Y.Z tag', () => {
      const runGit = fakeGit({ [describeArgs]: '1.2.3' });

      it('returns the previous tag', () => {
        expect(resolveBaseRef(runGit, { CIRCLE_TAG: '1.3.0' })).toEqual('1.2.3');
      });
    });

    describe('on a tag without a previous X.Y.Z tag', () => {
      const runGit = fakeGit({ [describeArgs]: failure });

      it('returns undefined', () => {
        expect(resolveBaseRef(runGit, { CIRCLE_TAG: '0.1.0' })).toBeUndefined();
      });
    });

    describe('on main', () => {
      const runGit = fakeGit({});

      it('returns the parent commit', () => {
        expect(resolveBaseRef(runGit, { CIRCLE_BRANCH: 'main' })).toEqual('HEAD^');
      });
    });

    describe('on a PR branch', () => {
      const runGit = fakeGit({ 'merge-base HEAD origin/main': 'abc123' });

      it('returns the merge base with origin/main', () => {
        expect(resolveBaseRef(runGit, { CIRCLE_BRANCH: 'issue-1' })).toEqual('abc123');
      });
    });

    describe('outside CI', () => {
      const runGit = fakeGit({ 'merge-base HEAD origin/main': 'abc123' });

      it('returns the merge base with origin/main', () => {
        expect(resolveBaseRef(runGit, {})).toEqual('abc123');
      });
    });

    describe('when the merge base cannot be found', () => {
      const runGit = fakeGit({ 'merge-base HEAD origin/main': failure });

      it('returns undefined', () => {
        expect(resolveBaseRef(runGit, { CIRCLE_BRANCH: 'issue-1' })).toBeUndefined();
      });
    });
  });

  describe('readVersionAt', () => {
    describe('when the package.json exists at the ref', () => {
      const runGit = fakeGit({ 'show base:logger/package.json': '{"version":"0.3.0"}' });

      it('returns its version', () => {
        expect(readVersionAt(runGit, 'base', 'logger')).toEqual('0.3.0');
      });
    });

    describe('when the package.json is missing at the ref', () => {
      const runGit = fakeGit({ 'show base:logger/package.json': failure });

      it('returns undefined', () => {
        expect(readVersionAt(runGit, 'base', 'logger')).toBeUndefined();
      });
    });
  });

  describe('collectVersions', () => {
    const tree = {
      packages: {
        'deku-sprout': { folder: 'logger', platform: 'npm', dependsOn: [] },
        'navi-hey': { folder: 'source', platform: 'npm', dependsOn: ['deku-sprout'] },
        'darthjee/navi-hey': { folder: 'source', platform: 'docker', dependsOn: ['navi-hey'] },
      },
    };
    const runGit = fakeGit({
      'show base:logger/package.json': '{"version":"0.3.0"}',
      'show base:source/package.json': failure,
    });

    it('maps npm keys to versions, skipping missing packages and docker entries', () => {
      expect(collectVersions(runGit, tree, 'base')).toEqual({ 'deku-sprout': '0.3.0' });
    });
  });

  describe('gitRunner', () => {
    const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const runGit = gitRunner(rootDir);

    it('returns the trimmed stdout of git', () => {
      expect(runGit(['rev-parse', '--is-inside-work-tree'])).toEqual('true');
    });

    it('throws when git fails', () => {
      expect(() => runGit(['show', 'HEAD:does/not/exist.json'])).toThrow();
    });
  });
});
