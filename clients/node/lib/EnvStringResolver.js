import { Logger } from './logging/Logger.js';

/**
 * Pattern matching environment variable references in strings.
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax.
 * @type {RegExp}
 */
const ENV_VAR_PATTERN = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * EnvStringResolver resolves `$VAR`/`${VAR}` environment variable references
 * in a raw string (e.g. a config file's content) against the current process's
 * environment, substituting an empty string for any variable that isn't set.
 *
 * This is a small, self-contained client-side port of the engine's
 * `source/lib/common/utils/env_resolver/EnvStringResolver.js` — the client
 * package doesn't depend on `source/` or its `Logger` utility.
 *
 * @author darthjee
 */
class EnvStringResolver {
  /**
   * @param {string} string Raw string content.
   */
  constructor(string) {
    this.string = string;
  }

  /**
   * Resolves environment variable references in a raw string (e.g. config file content).
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
   * Resolves environment variable references in a raw string (e.g. config file content).
   *
   * Replaces all `$VAR` and `${VAR}` occurrences with their environment values.
   *
   * @returns {string} Resolved string with env var references replaced.
   */
  resolve() {
    return String(this.string).replace(ENV_VAR_PATTERN, (_match, braced, bare) => {
      const varName = braced || bare;
      const resolved = process.env[varName];

      if (resolved === undefined) {
        Logger.warn(`Environment variable not defined: ${varName}`);
        return '';
      }

      return resolved;
    });
  }
}

export { EnvStringResolver };
