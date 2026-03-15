import { fileURLToPath } from 'url';
import { readFileSync } from 'node:fs';

class FixturesUtils {
  static getFixturePath(file) {
    return fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));
  }

  static loadFixture(file) {
    const filePath = this.getFixturePath(file);
    return readFileSync(filePath, 'utf8');
  }
}
export { FixturesUtils };