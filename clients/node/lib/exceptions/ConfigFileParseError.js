/**
 * Error raised when a config file given to `configFromJson`/`configFromYaml`/
 * `configFromFiles` cannot be read from disk, or fails to parse as JSON/YAML.
 *
 * @author darthjee
 */
class ConfigFileParseError extends Error {
  /**
   * @param {string} message Human-readable description of the failure.
   * @param {object} [attributes={}] Extra attributes describing the failure.
   * @param {string} [attributes.path] The file path that failed to read/parse.
   * @param {Error} [attributes.cause] The underlying error, when available.
   */
  constructor(message, { path, cause } = {}) {
    super(message);
    this.name = 'ConfigFileParseError';
    this.path = path;
    this.cause = cause;
  }
}

export { ConfigFileParseError };
