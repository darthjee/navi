import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Logger } from '../../common/utils/logging/Logger.js';
import { ExtensionsDirectoryMissing } from '../../exceptions/config/ExtensionsDirectoryMissing.js';
import { ForbiddenError } from '../../exceptions/http/ForbiddenError.js';
import { PathValidator } from '../PathValidator.js';
import { ExtensionModuleValidator } from './ExtensionModuleValidator.js';
import { ExtensionsEnv } from './ExtensionsEnv.js';

/**
 * ExtensionRoutesLoader is the boot-time orchestrator that turns the mounted
 * `<NAVI_EXTENSIONS_DIR>/backend/*.js` folder into a ready-to-register list of
 * `{ method, path, handler }` descriptors: validated, de-collided against the
 * stock Navi routes and against each other, and ordered by filename. It returns
 * `[]` when the feature is disabled and only throws for the single fatal case —
 * enabled but the extensions directory is absent.
 * @author darthjee
 */
class ExtensionRoutesLoader {
  /**
   * Loads and validates the mounted backend extension routes.
   * @param {object} [options={}] - Loader options.
   * @param {Set<string>} [options.stockRouteKeys] - Frozen set of `"<METHOD> <path>"`
   *   keys for the built-in Navi routes; extension routes colliding with one are dropped.
   * @returns {Promise<Array<{ method: string, path: string, handler: Function }>>}
   *   The accepted descriptors, or `[]` when extensions are disabled or no backend folder exists.
   * @throws {ExtensionsDirectoryMissing} When extensions are enabled but the directory is absent.
   */
  static async load({ stockRouteKeys } = {}) {
    if (!ExtensionsEnv.enabled) return [];

    const { dir, backendDir } = ExtensionsEnv;

    if (!ExtensionRoutesLoader.#isDirectory(dir)) {
      throw new ExtensionsDirectoryMissing(dir);
    }

    if (!ExtensionRoutesLoader.#isDirectory(backendDir)) {
      Logger.info(`[extensions] no backend extensions (${backendDir})`);
      return [];
    }

    const accepted = await ExtensionRoutesLoader.#collect({
      backendDir,
      stockKeys: stockRouteKeys ?? new Set(),
    });

    ExtensionRoutesLoader.#logAudit(accepted);

    return accepted.map(({ method, path: routePath, handler }) => ({
      method,
      path: routePath,
      handler,
    }));
  }

  /**
   * Iterates the backend folder in lexicographic order, accumulating descriptors.
   * @param {object} params - Iteration parameters.
   * @param {string} params.backendDir - Absolute path to the `backend/` folder.
   * @param {Set<string>} params.stockKeys - Stock route keys to collide against.
   * @returns {Promise<Array<object>>} The accepted `{ method, path, handler, source }` descriptors.
   */
  static async #collect({ backendDir, stockKeys }) {
    const filenames = fs.readdirSync(backendDir)
      .filter((name) => name.endsWith('.js'))
      .sort();

    const validator = new PathValidator(backendDir);
    const accepted = [];
    const seen = new Map();

    for (const name of filenames) {
      // eslint-disable-next-line no-await-in-loop
      const descriptors = await ExtensionRoutesLoader.#readFile({ name, backendDir, validator });

      descriptors.forEach((descriptor) => {
        ExtensionRoutesLoader.#accept({ descriptor, name, stockKeys, seen, accepted });
      });
    }

    return accepted;
  }

  /**
   * Resolves, path-checks, imports and validates a single backend file.
   * @param {object} params - File parameters.
   * @param {string} params.name - The bare filename.
   * @param {string} params.backendDir - Absolute path to the `backend/` folder.
   * @param {PathValidator} params.validator - Validator bound to `backendDir`.
   * @returns {Promise<Array<object>>} The file's valid descriptors, or `[]` when it is skipped.
   */
  static async #readFile({ name, backendDir, validator }) {
    const resolved = path.resolve(backendDir, name);

    if (!ExtensionRoutesLoader.#isInside(resolved, validator, name)) return [];

    let moduleNamespace;

    try {
      moduleNamespace = await import(pathToFileURL(resolved).href);
    } catch (error) {
      Logger.warn(`[extensions] skipping ${name}: ${error.message}`);
      return [];
    }

    const { descriptors, errors } = ExtensionModuleValidator.validate(moduleNamespace);

    errors.forEach((message) => Logger.warn(`[extensions] skipping ${name}: ${message}`));

    return descriptors;
  }

  /**
   * Confirms the file (following symlinks) stays inside the backend folder.
   * @param {string} resolved - The `path.resolve`d file path.
   * @param {PathValidator} validator - Validator bound to the backend folder.
   * @param {string} name - The bare filename, for logging.
   * @returns {boolean} True when the real path is inside the backend folder.
   */
  static #isInside(resolved, validator, name) {
    let real = resolved;

    try {
      real = fs.realpathSync(resolved);
    } catch {
      real = resolved;
    }

    try {
      validator.validate(real);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        Logger.warn(`[extensions] skipping ${name}: path escapes backend/`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Records a descriptor unless it collides with a stock route or an earlier extension route.
   * @param {object} params - Acceptance parameters.
   * @param {object} params.descriptor - The normalised `{ method, path, handler }` descriptor.
   * @param {string} params.name - The source filename.
   * @param {Set<string>} params.stockKeys - Stock route keys.
   * @param {Map<string, string>} params.seen - Map of already-accepted keys to their source file.
   * @param {Array<object>} params.accepted - The accumulator to push into.
   * @returns {void}
   */
  static #accept({ descriptor, name, stockKeys, seen, accepted }) {
    const key = `${descriptor.method} ${descriptor.path}`;

    if (stockKeys.has(key)) {
      Logger.warn(`[extensions] skipping ${key} from ${name}: path is a built-in Navi route`);
      return;
    }

    if (seen.has(key)) {
      Logger.warn(`[extensions] skipping ${key} from ${name}: already registered by ${seen.get(key)}`);
      return;
    }

    seen.set(key, name);
    accepted.push({ ...descriptor, source: name });
  }

  /**
   * Emits the single audit line listing every accepted route.
   * @param {Array<object>} accepted - The accepted `{ method, path, source }` descriptors.
   * @returns {void}
   */
  static #logAudit(accepted) {
    const list = accepted
      .map(({ method, path: routePath, source }) => `${method} ${routePath} (${source})`)
      .join(', ');

    Logger.info(`[extensions] loaded ${accepted.length} backend route(s): ${list}`);
  }

  /**
   * @param {string} target - A filesystem path.
   * @returns {boolean} True when `target` exists and is a directory.
   */
  static #isDirectory(target) {
    try {
      return fs.statSync(target).isDirectory();
    } catch {
      return false;
    }
  }
}

export { ExtensionRoutesLoader };
