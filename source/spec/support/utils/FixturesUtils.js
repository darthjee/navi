import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

class FixturesUtils {
  static getFixturePath(file) {
    return fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));
  }

  static loadFixture(file) {
    const filePath = this.getFixturePath(file);
    return readFileSync(filePath, 'utf8');
  }

  static loadYamlFixture(file) {
    const fileContent = this.loadFixture(file);
    return YAML.parse(fileContent);
  }
}
export { FixturesUtils };