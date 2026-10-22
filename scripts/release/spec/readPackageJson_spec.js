import fs from 'fs';
import os from 'os';
import path from 'path';
import { packageJsonReader } from '../lib/readPackageJson.js';

describe('packageJsonReader', () => {
  let rootDir;
  let reader;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-pkg-'));
    fs.mkdirSync(path.join(rootDir, 'a'));
    fs.writeFileSync(path.join(rootDir, 'a', 'package.json'), '{"name":"pkg-a"}');
    fs.mkdirSync(path.join(rootDir, 'empty'));
    reader = packageJsonReader(rootDir);
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('returns the parsed package.json', () => {
    expect(reader('a')).toEqual({ name: 'pkg-a' });
  });

  it('returns null when the folder has no package.json', () => {
    expect(reader('empty')).toBeNull();
  });

  it('returns null when the folder is missing', () => {
    expect(reader('missing')).toBeNull();
  });
});
