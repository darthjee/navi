import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

class FixturesUtils {
  static getFixturePath(file) {
    return fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));
  }

  static loadFixture(file) {
    const filePath = this.getFixturePath(file);
    return readFileSync(filePath, 'utf8');
  }

  static loadYamlFixture(file) {
    return load(this.loadFixture(file));
  }
}

export { FixturesUtils };
