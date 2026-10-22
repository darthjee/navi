import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

/**
 * Normalizes one raw `release.yml` entry into the tree's entry shape.
 *
 * @param {object} raw - The raw YAML entry.
 * @returns {{folder: string, platform: string, dependsOn: string[], tagPrefix: (string|undefined)}}
 */
const normalizeEntry = (raw) => {
  const entry = raw || {};

  return {
    folder: entry.folder,
    platform: entry.platform,
    dependsOn: entry.depends_on || [],
    tagPrefix: entry.tag_prefix,
  };
};

/**
 * Reads and parses `release.yml` from a root directory.
 *
 * @param {string} rootDir - Directory holding `release.yml`.
 * @returns {{packages: Object<string, object>}} The parsed release tree.
 * @throws {Error} When `release.yml` has no `packages` map.
 */
const loadReleaseTree = (rootDir) => {
  const file = path.join(rootDir, 'release.yml');
  const data = YAML.parse(fs.readFileSync(file, 'utf8')) || {};

  if (!data.packages || typeof data.packages !== 'object' || Array.isArray(data.packages)) {
    throw new Error(`${file}: missing 'packages' map`);
  }

  const packages = {};

  for (const [key, raw] of Object.entries(data.packages)) {
    packages[key] = normalizeEntry(raw);
  }

  return { packages };
};

export { loadReleaseTree };
