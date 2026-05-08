/**
 * Pattern matching environment variable references in strings.
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax.
 * @type {RegExp}
 */
const ENV_VAR_PATTERN = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

class EnvStringResolver {
  /**
   * @param {String} string Raw string content.
   */
  constructor(string) {
    this.string = String(string);
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
   * Replaces all `$VAR` and `${VAR}` occurrences with their environment values.
   *
   * @returns {string} Resolved string with env var references replaced.
   */
  resolve() {
    const string = this.string;
    return string.replace(ENV_VAR_PATTERN, this.#replace.bind(this));
  }

  #replace(_match, braced, bare) {
    const varName = braced || bare;
    const resolved = process.env[varName];

    if (resolved === undefined) {
      console.warn(`Environment variable not defined: ${varName}`);
      return '';
    }

    return resolved;
  }
}

export { EnvStringResolver };