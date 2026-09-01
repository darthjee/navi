import { createHash } from 'node:crypto';
import { Logger } from '../logging/Logger.js';

/**
 * Pattern matching environment variable references in strings.
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax.
 * @type {RegExp}
 */
const ENV_VAR_PATTERN = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * Number of leading hex characters of the SHA-256 digest kept in a match's
 * `hash` field — enough to spot value drift between runs without logging the
 * raw value itself.
 * @type {number}
 */
const HASH_LENGTH = 12;

class EnvStringResolver {
  /**
   * @param {string} string Raw string content.
   */
  constructor(string) {
    this.string = string;

    /**
     * Per-occurrence resolution data recorded by the last `resolve()` call,
     * in match order (not deduped). Each entry is
     * `{ varName, defined, length, hash }`, where `length`/`hash` are only
     * present when `defined` is `true`. Consumers (e.g. `ConfigIncluder`)
     * use this for debug logging — the raw resolved value is never recorded.
     * @type {Array<{varName: string, defined: boolean, length?: number, hash?: string}>}
     */
    this.matches = [];
  }

  /**
   * Resolves environment variable references in a raw string (e.g. YAML file content).
   *
   * Replaces all `$VAR` and `${VAR}` occurrences with their environment values.
   *
   * @param {string} string Raw string content.
   * @returns {string} Resolved string with env var references replaced.
   */
  static resolve(string) {
    return new EnvStringResolver(string).resolve();
  }

  /**
   * Resolves environment variable references in a raw string (e.g. YAML file content).
   *
   * Replaces all `$VAR` and `${VAR}` occurrences with their environment values,
   * recording per-occurrence resolution data into `this.matches` as it goes.
   *
   * @returns {string} Resolved string with env var references replaced.
   */
  resolve() {
    return String(this.string).replace(ENV_VAR_PATTERN, (_match, braced, bare) => {
      const varName = braced || bare;
      const resolved = process.env[varName];
      const defined = resolved !== undefined;

      this.matches.push(defined
        ? { varName, defined, length: resolved.length, hash: this.#hash(resolved) }
        : { varName, defined });

      if (!defined) {
        Logger.warn(`Environment variable not defined: ${varName}`);
        return '';
      }

      return resolved;
    });
  }

  /**
   * Hashes a resolved value for safe (non-reversible) debug logging.
   *
   * @param {string} value The resolved value to hash.
   * @returns {string} The first {@link HASH_LENGTH} hex characters of the value's SHA-256 digest.
   * @private
   */
  #hash(value) {
    return createHash('sha256').update(value).digest('hex').slice(0, HASH_LENGTH);
  }
}

export { EnvStringResolver };
