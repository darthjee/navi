import { execFileSync } from 'child_process';

/**
 * Pattern matching the plain `X.Y.Z` release tags, shared with
 * `scripts/lib/package_bump_check.sh`.
 */
const VERSION_TAG_PATTERN = '[0-9]*.[0-9]*.[0-9]*';

/**
 * Builds a git runner bound to a directory.
 *
 * @param {string} rootDir - Repository root.
 * @returns {function(string[]): string} Runner returning trimmed stdout;
 *   throws when git exits non-zero.
 */
const gitRunner = (rootDir) => (args) => execFileSync('git', args, {
  cwd: rootDir,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

/**
 * Runs git, returning undefined instead of throwing on failure.
 *
 * @param {function(string[]): string} runGit - Git runner.
 * @param {string[]} args - Git arguments.
 * @returns {(string|undefined)} Stdout, or undefined when git failed.
 */
const tryGit = (runGit, args) => {
  try {
    return runGit(args) || undefined;
  } catch {
    return undefined;
  }
};

/**
 * Reads the `version` of a folder's package.json at a ref.
 *
 * @param {function(string[]): string} runGit - Git runner.
 * @param {string} ref - Git ref.
 * @param {string} folder - Folder relative to the repository root.
 * @returns {(string|undefined)} The version, or undefined when the
 *   package.json does not exist at that ref.
 */
const readVersionAt = (runGit, ref, folder) => {
  const content = tryGit(runGit, ['show', `${ref}:${folder}/package.json`]);

  return content === undefined ? undefined : JSON.parse(content).version;
};

/**
 * Resolves the comparison base for the current CI context.
 *
 * - tags (`CIRCLE_TAG`): the previous `X.Y.Z` tag reachable from `HEAD^`;
 * - `main` (`CIRCLE_BRANCH`): `HEAD^`;
 * - any other branch: the merge base of `HEAD` and `origin/main`.
 *
 * @param {function(string[]): string} runGit - Git runner.
 * @param {object} env - Environment variables.
 * @returns {(string|undefined)} The base ref, or undefined when none exists.
 */
const resolveBaseRef = (runGit, env) => {
  if (env.CIRCLE_TAG) {
    return tryGit(runGit, [
      'describe', '--tags', '--abbrev=0', `--match=${VERSION_TAG_PATTERN}`, 'HEAD^',
    ]);
  }

  if (env.CIRCLE_BRANCH === 'main') {
    return 'HEAD^';
  }

  return tryGit(runGit, ['merge-base', 'HEAD', 'origin/main']);
};

/**
 * Collects the versions of the npm entries of a tree at a ref.
 *
 * @param {function(string[]): string} runGit - Git runner.
 * @param {{packages: object}} tree - Tree returned by `loadReleaseTree`.
 * @param {string} ref - Git ref.
 * @returns {Object<string, string>} npm key to version; packages with no
 *   package.json at that ref are left out.
 */
const collectVersions = (runGit, tree, ref) => {
  const versions = {};

  for (const [key, entry] of Object.entries(tree.packages)) {
    if (entry.platform !== 'npm') {
      continue;
    }

    const version = readVersionAt(runGit, ref, entry.folder);

    if (version !== undefined) {
      versions[key] = version;
    }
  }

  return versions;
};

export { collectVersions, gitRunner, readVersionAt, resolveBaseRef };
