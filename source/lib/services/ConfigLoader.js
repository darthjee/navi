import { ConfigIncluder } from './ConfigIncluder.js';
import { ConfigParser } from './ConfigParser.js';
import { NamespaceMapBuilder } from './NamespaceMapBuilder.js';

/**
 * ConfigLoader loads a YAML configuration file (and every file transitively reachable
 * through its `include:` chain), grouping the resources/clients contributed by each
 * file into a NamespaceMap, and sourcing worker/web/log/failure sections from the
 * entry file only.
 * @author darthjee
 */
class ConfigLoader {
  /**
   * @param {string} filePath Path to the YAML configuration file.
   */
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Loads the configuration starting from the given entry file path.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {{
   * namespaceMap: Record<string, Namespace>,
   * workersConfig: WorkersConfig,
   * webConfig: WebConfig|null,
   * logConfig: LogConfig,
   * failureConfig: FailureConfig|null
   * }} The built namespace map, alongside the entry file's non-resource configuration sections.
   * @throws {MissingTopLevelConfigKey} Throws when a single-file (no `include:`) config is
   * invalid or does not contain required keys.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @throws {ConfigurationIncludeNotFound} If an included configuration file is not found.
   */
  static fromFile(filePath) {
    return new ConfigLoader(filePath).load();
  }

  /**
   * Resolves the include chain, builds the NamespaceMap, and extracts the entry
   * file's worker/web/log/failure configuration sections.
   * @returns {{
   * namespaceMap: Record<string, Namespace>,
   * workersConfig: WorkersConfig,
   * webConfig: WebConfig|null,
   * logConfig: LogConfig,
   * failureConfig: FailureConfig|null
   * }} The built namespace map, alongside the entry file's non-resource configuration sections.
   * @throws {MissingTopLevelConfigKey} Throws when a single-file (no `include:`) config is
   * invalid or does not contain required keys.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @throws {ConfigurationIncludeNotFound} If an included configuration file is not found.
   */
  load() {
    const includer = new ConfigIncluder(this.filePath);
    const files = includer.resolve();
    const namespaceMap = NamespaceMapBuilder.build(files);
    const entryConfig = ConfigParser.fromObject(includer.entryRaw, { strict: false });

    return {
      namespaceMap,
      workersConfig: entryConfig.workersConfig,
      webConfig:     entryConfig.webConfig,
      logConfig:     entryConfig.logConfig,
      failureConfig: entryConfig.failureConfig,
    };
  }
}

export { ConfigLoader };
