/**
 * ConfigStore holds the output of a single configuration load: the parsed
 * `Config` model, the `BufferedLogger` created for it, and the path to the entry
 * configuration file.
 *
 * It is a plain value holder — it performs no path resolution or normalization.
 * The `entryFilePath` is stored verbatim so that `ConfigIncluder` can resolve
 * relative `include:` paths against the entry file's own directory.
 * @author darthjee
 */
class ConfigStore {
  #config;
  #bufferedLogger;
  #entryFilePath;

  /**
   * @param {object} params - The config-load output.
   * @param {Config} params.config - The parsed configuration model.
   * @param {BufferedLogger} params.bufferedLogger - The buffered logger created for this config.
   * @param {string} params.entryFilePath - The path to the entry configuration file, stored verbatim.
   */
  constructor({ config, bufferedLogger, entryFilePath }) {
    this.#config = config;
    this.#bufferedLogger = bufferedLogger;
    this.#entryFilePath = entryFilePath;
  }

  /**
   * Gets the parsed configuration model.
   * @returns {Config} The configuration model.
   */
  get config() {
    return this.#config;
  }

  /**
   * Gets the buffered logger created during config loading.
   * @returns {BufferedLogger} The buffered logger instance.
   */
  get bufferedLogger() {
    return this.#bufferedLogger;
  }

  /**
   * Gets the entry configuration file path exactly as it was passed in, without
   * any resolution or normalization.
   * @returns {string} The entry configuration file path, verbatim.
   */
  get entryFilePath() {
    return this.#entryFilePath;
  }
}

export { ConfigStore };
