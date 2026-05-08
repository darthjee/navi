import { EnvStringResolver } from './env_resolver/EnvStringResolver.js';

/**
 * Resolves environment variable references in string values.
 *
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax, resolved from
 * `process.env` at call time. Logs a warning when a referenced
 * variable is not defined and replaces it with an empty string.
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
      Object.entries(object).map(([key, value]) => [key, EnvResolver.resolveString(value)])
    );
  }

  /**
   * Resolves environment variable references in a raw string (e.g. YAML file content).
   *
   * Replaces all `$VAR` and `${VAR}` occurrences with their environment values.
   *
   * @param {string} string Raw string content.
   * @returns {string} Resolved string with env var references replaced.
   */
  static resolveString(string) {
    return new EnvStringResolver(string).resolve();
  }
}

export { EnvResolver };
