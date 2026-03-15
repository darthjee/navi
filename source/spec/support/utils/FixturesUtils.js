import { fileURLToPath } from 'url';

class FixturesUtils {
  static getFixturePath(file) {
    return fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url));
  }
}
export { FixturesUtils };