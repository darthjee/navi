import { checkCascadeBumps } from '../lib/checkCascadeBumps.js';
import * as index from '../lib/index.js';
import { loadReleaseTree } from '../lib/loadReleaseTree.js';
import { packageJsonReader } from '../lib/readPackageJson.js';
import { validateReleaseTree } from '../lib/validateReleaseTree.js';

describe('index', () => {
  it('re-exports the library functions', () => {
    expect(index.checkCascadeBumps).toBe(checkCascadeBumps);
    expect(index.loadReleaseTree).toBe(loadReleaseTree);
    expect(index.packageJsonReader).toBe(packageJsonReader);
    expect(index.validateReleaseTree).toBe(validateReleaseTree);
  });
});
