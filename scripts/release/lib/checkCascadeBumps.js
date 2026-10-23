/**
 * Builds the reverse dependency map of the npm entries of a tree: for each
 * npm key, the npm keys whose `depends_on` lists it. Docker entries are
 * skipped, since their version follows their folder's npm package.
 *
 * @param {object} packages - The tree's packages map.
 * @returns {Object<string, string[]>} Dependents per npm key.
 */
const buildDependents = (packages) => {
  const dependents = {};

  for (const [key, entry] of Object.entries(packages)) {
    if (entry.platform !== 'npm') {
      continue;
    }

    for (const dep of entry.dependsOn) {
      dependents[dep] = dependents[dep] || [];
      dependents[dep].push(key);
    }
  }

  return dependents;
};

/**
 * Lists every package depending on a key, directly or transitively.
 *
 * @param {string} key - The bumped npm key.
 * @param {Object<string, string[]>} dependents - Reverse dependency map.
 * @returns {string[]} Transitive dependents, without the key itself.
 */
const transitiveDependents = (key, dependents) => {
  const seen = new Set([key]);
  const queue = [key];
  const found = [];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const dependent of dependents[current] || []) {
      if (!seen.has(dependent)) {
        seen.add(dependent);
        found.push(dependent);
        queue.push(dependent);
      }
    }
  }

  return found;
};

/**
 * Tells whether a package changed version. A package missing at either ref
 * counts as not bumped.
 *
 * @param {string} key - The npm key.
 * @param {Object<string, string>} baseVersions - Versions at the base ref.
 * @param {Object<string, string>} headVersions - Versions at HEAD.
 * @returns {boolean} True when bumped.
 */
const isBumped = (key, baseVersions, headVersions) => {
  const base = baseVersions[key];
  const head = headVersions[key];

  return base !== undefined && head !== undefined && base !== head;
};

/**
 * Lists the missing cascade bumps: every package depending, directly or
 * transitively, on a bumped package must be bumped too.
 *
 * @param {{packages: object}} tree - Tree returned by `loadReleaseTree`.
 * @param {Object<string, string>} baseVersions - npm key to version at the
 *   base ref; missing when the package has no package.json there.
 * @param {Object<string, string>} headVersions - npm key to version at HEAD.
 * @returns {string[]} Sorted errors; empty when every cascade bump is there.
 */
const checkCascadeBumps = (tree, baseVersions, headVersions) => {
  const { packages } = tree;
  const dependents = buildDependents(packages);
  const bumped = (key) => isBumped(key, baseVersions, headVersions);
  const errors = new Set();

  const npmKeys = Object.keys(packages)
    .filter((key) => packages[key].platform === 'npm');

  for (const key of npmKeys.filter(bumped)) {
    const change = `${baseVersions[key]} -> ${headVersions[key]}`;

    for (const dependent of transitiveDependents(key, dependents)) {
      if (!bumped(dependent)) {
        errors.add(`${dependent} must be bumped because ${key} changed ${change}`);
      }
    }
  }

  return [...errors].sort();
};

export { checkCascadeBumps };
