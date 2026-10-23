#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { describePackage, loadReleaseTree } from '../lib/index.js';

const name = process.argv[2];

if (!name) {
  console.error('Usage: release-package-info.js <package> [rootDir]');
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(process.argv[3] || path.join(scriptDir, '../../..'));

let info;

try {
  info = describePackage(loadReleaseTree(rootDir), name);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

process.stdout.write([
  `FOLDER=${info.folder || ''}`,
  `PLATFORM=${info.platform || ''}`,
  `TAG_PREFIX=${info.tagPrefix || ''}`,
  `DEPENDS_ON=${info.dependsOn.join(' ')}`,
  '',
].join('\n'));
