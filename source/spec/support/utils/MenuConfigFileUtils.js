import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MenuConfig } from '../../../lib/models/configs/MenuConfig.js';

/**
 * Test utility for MenuConfig specs: manages a temporary directory per example,
 * writes inline `menu.yml` documents into it and renders the parsed entries.
 */
class MenuConfigFileUtils {
  /**
   * Expected JSON for the shipped Logs default entry.
   * @type {{route: string, text: string}}
   */
  static LOGS = { route: '/logs', text: 'Logs' };

  /**
   * Expected JSON for the shipped Memory default entry.
   * @type {{route: string, text: string}}
   */
  static MEMORY = { route: '/memory/status', text: 'Memory' };

  /**
   * Expected JSON for the full default menu, in shipped order.
   * @type {Array<{route: string, text: string}>}
   */
  static DEFAULTS = [MenuConfigFileUtils.LOGS, MenuConfigFileUtils.MEMORY];

  /**
   * Creates a fresh temporary directory for a spec example.
   * @returns {string} The absolute path of the new directory.
   */
  static createTempDir() {
    return mkdtempSync(join(tmpdir(), 'menu-config-'));
  }

  /**
   * Removes a temporary directory created by {@link MenuConfigFileUtils.createTempDir}.
   * @param {string} dir - The directory to remove.
   */
  static removeTempDir(dir) {
    // Invariant: `dir` always comes from `createTempDir` in the calling spec,
    // never from external/user input, so it is not attacker-controllable.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    rmSync(dir, { recursive: true, force: true });
  }

  /**
   * Writes a `menu.yml` document into the given directory.
   * @param {string} dir - The temporary directory created by the spec.
   * @param {string|string[]} lines - The file content, or lines joined with `\n`.
   * @returns {string} The path of the written file.
   */
  static write(dir, lines) {
    const content = Array.isArray(lines) ? lines.join('\n') : lines;
    const path = join(dir, 'menu.yml');
    // Invariant: `path` is always inside a temp dir the calling spec created
    // via `createTempDir`, never derived from external/user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(path, content, 'utf8');
    return path;
  }

  /**
   * Loads a menu file and renders its entries as plain JSON objects.
   * @param {string} path - The menu file path.
   * @returns {Array<object>} The rendered entries.
   */
  static rendered(path) {
    return MenuConfig.fromFile(path).map((entry) => entry.toJSON());
  }
}

export { MenuConfigFileUtils };
