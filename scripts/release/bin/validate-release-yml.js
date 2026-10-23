#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { loadReleaseTree, packageJsonReader, validateReleaseTree } from '../lib/index.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(process.argv[2] || path.join(scriptDir, '../../..'));

const tree = loadReleaseTree(rootDir);
const errors = validateReleaseTree(tree, packageJsonReader(rootDir));

if (errors.length > 0) {
  console.error('release.yml is out of sync:');
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

process.stdout.write(`release.yml OK (${Object.keys(tree.packages).length} packages)\n`);
