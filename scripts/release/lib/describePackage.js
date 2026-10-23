/**
 * Describes one package of a release tree.
 *
 * @param {{packages: object}} tree - Tree returned by `loadReleaseTree`.
 * @param {string} name - The release key of the package.
 * @returns {{name: string, folder: string, platform: string, tagPrefix: (string|undefined), dependsOn: string[]}}
 *   The package's release data.
 * @throws {Error} When the package is not in the tree.
 */
const describePackage = (tree, name) => {
  const entry = Object.prototype.hasOwnProperty.call(tree.packages, name)
    ? tree.packages[name]
    : undefined;

  if (!entry) {
    throw new Error(`unknown package '${name}' in release.yml`);
  }

  return {
    name,
    folder: entry.folder,
    platform: entry.platform,
    tagPrefix: entry.tagPrefix,
    dependsOn: entry.dependsOn,
  };
};

export { describePackage };
