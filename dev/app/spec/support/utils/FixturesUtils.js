import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

class FixturesUtils {
  static getFixturePath(file) {
    return fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));
  }

  static loadFixture(file) {
    const filePath = this.getFixturePath(file);
    // `filePath` is always a literal fixture filename supplied by the
    // calling spec code itself — this is a test-only helper, never
    // reachable from external input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readFileSync(filePath, 'utf8');
  }

  static loadYamlFixture(file) {
    return load(this.loadFixture(file));
  }
}

export { FixturesUtils };
