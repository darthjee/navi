import path from 'path';

const TRUTHY_VALUES = ['1', 'true', 'yes', 'on'];
const DEFAULT_EXTENSIONS_DIR = '/navi/extensions';

/**
 * ExtensionsEnv is the single source of truth for the two extension environment
 * variables. It reads `process.env` on every access (never caching) so that
 * tests that mutate `process.env` are honoured. It is never instantiated;
 * everything is exposed through static getters, mirroring the env-reading
 * precedent set by `BaseLogger`.
 * @author darthjee
 */
class ExtensionsEnv {
  /**
   * @returns {boolean} True only when `NAVI_EXTENSIONS_ENABLED`, trimmed and
   *   lower-cased, is one of `1`, `true`, `yes`, `on`.
   */
  static get enabled() {
    const value = String(process.env.NAVI_EXTENSIONS_ENABLED ?? '').trim().toLowerCase();

    return TRUTHY_VALUES.includes(value);
  }

  /**
   * @returns {string} `NAVI_EXTENSIONS_DIR` when it is a non-empty string, else
   *   the default `/navi/extensions`.
   */
  static get dir() {
    const value = process.env.NAVI_EXTENSIONS_DIR;

    if (typeof value === 'string' && value.length > 0) return value;

    return DEFAULT_EXTENSIONS_DIR;
  }

  /**
   * @returns {string} The `backend` sub-directory of `dir`.
   */
  static get backendDir() {
    return path.join(ExtensionsEnv.dir, 'backend');
  }
}

export { ExtensionsEnv };
