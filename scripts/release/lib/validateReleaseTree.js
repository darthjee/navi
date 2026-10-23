/**
 * Lists the names declared as runtime dependencies of a package.json.
 * `devDependencies` are intentionally ignored.
 *
 * @param {object} pkg - Parsed package.json.
 * @returns {string[]} Dependency names.
 */
const declaredDeps = (pkg) => [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

/**
 * Lists the npm keys of the tree.
 *
 * @param {object} packages - The tree's packages map.
 * @returns {string[]} npm release keys.
 */
const npmKeys = (packages) => Object.keys(packages)
  .filter((key) => packages[key].platform === 'npm');

/**
 * Checks an npm entry's `depends_on` against its package.json.
 *
 * @param {string} key - The release key.
 * @param {object} entry - The release entry.
 * @param {object} pkg - Parsed package.json.
 * @param {string[]} localNames - npm keys of the tree.
 * @returns {string[]} Errors found.
 */
const checkNpmEntry = (key, entry, pkg, localNames) => {
  const errors = [];

  if (pkg.name !== key) {
    errors.push(`${key}: package.json name is '${pkg.name}'`);
  }

  const declared = declaredDeps(pkg);
  const localDeclared = declared.filter((dep) => localNames.includes(dep));

  for (const dep of localDeclared) {
    if (!entry.dependsOn.includes(dep)) {
      errors.push(`${key}: declares ${dep} but depends_on does not list it`);
    }
  }

  for (const dep of entry.dependsOn) {
    if (!declared.includes(dep)) {
      errors.push(`${key}: depends_on lists ${dep} but package.json does not declare it`);
    }
  }

  return errors;
};

/**
 * Checks that a docker entry depends on exactly the npm package in its folder.
 *
 * @param {string} key - The release key.
 * @param {object} entry - The release entry.
 * @param {object} packages - The tree's packages map.
 * @returns {string[]} Errors found.
 */
const checkDockerEntry = (key, entry, packages) => {
  const sibling = npmKeys(packages)
    .find((other) => packages[other].folder === entry.folder);

  if (!sibling) {
    return [`${key}: no npm entry lives in folder '${entry.folder}'`];
  }

  const deps = entry.dependsOn;

  if (deps.length !== 1 || deps[0] !== sibling) {
    return [`${key}: depends_on must be exactly [${sibling}], got [${deps.join(', ')}]`];
  }

  return [];
};

/**
 * Validates a release tree against the package.json files of its folders.
 *
 * @param {{packages: object}} tree - Tree returned by `loadReleaseTree`.
 * @param {function(string): (object|null)} readPackageJson - Returns the
 *   parsed package.json of a folder, or null when it is missing.
 * @returns {string[]} Errors found; empty when the tree is valid.
 */
const validateReleaseTree = (tree, readPackageJson) => {
  const { packages } = tree;
  const localNames = npmKeys(packages);
  const errors = [];

  for (const [key, entry] of Object.entries(packages)) {
    const pkg = readPackageJson(entry.folder);

    if (!pkg) {
      errors.push(`${key}: folder '${entry.folder}' has no package.json`);
    } else if (entry.platform === 'npm') {
      errors.push(...checkNpmEntry(key, entry, pkg, localNames));
    }

    if (entry.platform === 'docker') {
      errors.push(...checkDockerEntry(key, entry, packages));
    }
  }

  return errors;
};

export { validateReleaseTree };
