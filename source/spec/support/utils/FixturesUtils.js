import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

class FixturesUtils {
  static getFixturePath(file) {
    return fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));
  }

  static loadFixture(file) {
    const filePath = this.getFixturePath(file);
    // Invariant: `filePath` is always derived from a literal fixture filename
    // supplied by the calling spec code itself — never from external/user
    // input — so it is not attacker-controllable.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readFileSync(filePath, 'utf8');
  }

  static loadYamlFixture(file) {
    const fileContent = this.loadFixture(file);
    return YAML.parse(fileContent);
  }
}
export { FixturesUtils };