import { Logger } from './logging/Logger.js';

/**
 * Pattern matching environment variable references in strings.
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax.
 * @type {RegExp}
 */
const ENV_VAR_PATTERN = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * Resolves environment variable references in string values.
 *
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax, resolved from
 * `process.env` at call time. Logs a warning when a referenced
 * variable is not defined and replaces it with an empty string.
 *
 * @author darthjee
 */
class EnvResolver {
  /**
   * Resolves environment variable references in all values of an object.
   *
   * @param {object} object Map of keys to raw string values.
   * @returns {object} A new object with env var references resolved in values.
   */
  static resolveObject(object) {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [key, EnvResolver.resolveValue(value)])
    );
  }

  /**
   * Resolves environment variable references in a single string value.
   *
   * @param {string} value Raw string value.
   * @returns {string} Resolved value with env var references replaced.
   */
  static resolveValue(value) {
    return String(value).replace(ENV_VAR_PATTERN, (_match, braced, bare) => {
      const varName = braced || bare;
      const resolved = process.env[varName];

      if (resolved === undefined) {
        Logger.warn(`Header references undefined environment variable: ${varName}`);
        return '';
      }

      return resolved;
    });
  }
}

export { EnvResolver };
