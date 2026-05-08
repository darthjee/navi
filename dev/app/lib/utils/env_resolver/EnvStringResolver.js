/**
 * Pattern matching environment variable references in strings.
 * Supports `$VAR_NAME` and `${VAR_NAME}` syntax.
 * @type {RegExp}
 */
const ENV_VAR_PATTERN = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

class EnvStringResolver {
  constructor(string) {
    this.string = string;
  }

  resolve() {
    const string = this.string;
    return String(string).replace(ENV_VAR_PATTERN, (_match, braced, bare) => {
      const varName = braced || bare;
      const resolved = process.env[varName];

      if (resolved === undefined) {
        console.warn(`Environment variable not defined: ${varName}`);
        return '';
      }

      return resolved;
    });
  }
}

export { EnvStringResolver };