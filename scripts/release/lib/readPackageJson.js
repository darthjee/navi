import fs from 'fs';
import path from 'path';

/**
 * Builds a reader returning the parsed package.json of a folder under a root.
 *
 * @param {string} rootDir - Repository root.
 * @returns {function(string): (object|null)} Reader; returns null when the
 *   folder or its package.json is missing.
 */
const packageJsonReader = (rootDir) => (folder) => {
  const file = path.join(rootDir, folder, 'package.json');

  if (!fs.existsSync(file)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

export { packageJsonReader };
