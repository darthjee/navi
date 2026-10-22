#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import {
  checkCascadeBumps, collectVersions, gitRunner, loadReleaseTree, resolveBaseRef,
} from '../lib/index.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(process.argv[2] || path.join(scriptDir, '../../..'));
const runGit = gitRunner(rootDir);

const tree = loadReleaseTree(rootDir);
const baseRef = process.argv[3] || resolveBaseRef(runGit, process.env);

if (!baseRef) {
  process.stdout.write('No comparison base found — skipping cascade-bump check\n');
  process.exit(0);
}

const errors = checkCascadeBumps(
  tree,
  collectVersions(runGit, tree, baseRef),
  collectVersions(runGit, tree, 'HEAD'),
);

if (errors.length > 0) {
  console.error(`Missing cascade bumps (base ${baseRef}):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

process.stdout.write(`Cascade bumps OK (base ${baseRef})\n`);
