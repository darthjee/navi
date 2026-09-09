import fs from 'node:fs';
import path from 'node:path';
import { RequestHandler } from '../../common/server/RequestHandler.js';
import { ExtensionsEnv } from '../extensions/ExtensionsEnv.js';

/**
 * Serves `GET /extensions/frontend.json`, the discovery manifest for mounted
 * frontend extension bundles. The mounted `<NAVI_EXTENSIONS_DIR>/frontend/`
 * folder is the single source of truth: it is enumerated flat and in
 * lexicographic order and each `*.js` file becomes a `{ src, css? }` entry.
 * Returns `{ bundles: [] }` (never 404) when the feature is disabled or the
 * folder is absent. `ExtensionsEnv` is read per request, never cached.
 * @author darthjee
 */
class FrontendManifestHandler extends RequestHandler {
  #response;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   */
  constructor(_request, response) {
    super();
    this.#response = response;
  }

  /**
   * Responds with the frontend extension manifest.
   * @returns {void}
   */
  handle() {
    this.#response.json({ bundles: this.#bundles() });
  }

  /**
   * @returns {Array<{ src: string, css?: string }>} One entry per `*.js` file in
   *   the mounted frontend folder, lexicographically ordered, or `[]` when the
   *   feature is disabled or the folder is absent.
   */
  #bundles() {
    if (!ExtensionsEnv.enabled) return [];

    const dir = ExtensionsEnv.frontendDir;

    if (!FrontendManifestHandler.#isDirectory(dir)) return [];

    return fs.readdirSync(dir)
      .filter((name) => name.endsWith('.js'))
      .sort()
      .map((name) => FrontendManifestHandler.#bundle(dir, name));
  }

  /**
   * Builds a single manifest entry, attaching a sibling stylesheet when present.
   * @param {string} dir - Absolute path to the frontend folder.
   * @param {string} name - The bare `*.js` filename.
   * @returns {{ src: string, css?: string }}
   */
  static #bundle(dir, name) {
    const entry = { src: `/extensions/frontend/${name}` };
    const cssName = name.replace(/\.js$/, '.css');

    if (fs.existsSync(path.join(dir, cssName))) {
      entry.css = `/extensions/frontend/${cssName}`;
    }

    return entry;
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

export { FrontendManifestHandler };
