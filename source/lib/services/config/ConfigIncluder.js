import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { EnvStringResolver } from '../../common/utils/env_resolver/EnvStringResolver.js';
import { ConfigurationFileNotFound } from '../../exceptions/config/ConfigurationFileNotFound.js';
import { ConfigurationIncludeNotFound } from '../../exceptions/config/ConfigurationIncludeNotFound.js';
import { Logger } from '../../utils/logging/Logger.js';

/**
 * ConfigIncluder recursively resolves the `include:` chain starting from an entry
 * configuration file, reading and YAML-parsing every reachable file.
 *
 * Each `include:` path is resolved relative to the directory of the file declaring
 * it, unless it is already an absolute path. Files already visited (by resolved
 * absolute path) are skipped on subsequent encounters, so duplicate/circular
 * `include:` entries are silently de-duplicated rather than raising an error.
 *
 * Only the *entry* file's `workers`/`web`/`log`/`failure` sections are ever
 * consulted (exposed via {@link ConfigIncluder#entryRaw}); included files are only
 * ever expected to contribute `resources`/`clients` to a namespace.
 * @author darthjee
 */
class ConfigIncluder {
  #visited;
  #files;
  #entryRaw;

  /**
   * @param {string} entryFilePath Path to the entry configuration file.
   */
  constructor(entryFilePath) {
    this.entryFilePath = entryFilePath;
    this.#visited = new Set();
    this.#files = [];
  }

  /**
   * Resolves the full include chain starting from the given entry file path.
   * @param {string} entryFilePath Path to the entry configuration file.
   * @returns {Array<{namespace: string, resources: object, clients: object, filePath: string}>}
   * The flat list of files contributing to the configuration.
   */
  static resolve(entryFilePath) {
    return new ConfigIncluder(entryFilePath).resolve();
  }

  /**
   * Resolves the full include chain starting from the entry file.
   * @returns {Array<{namespace: string, resources: object, clients: object, filePath: string}>}
   * The flat list of files contributing to the configuration.
   */
  resolve() {
    this.#collect(this.entryFilePath, { isEntry: true });
    return this.#files;
  }

  /**
   * Returns the entry file's raw parsed YAML object.
   * @returns {object|undefined} The entry file's raw parsed object.
   */
  get entryRaw() {
    return this.#entryRaw;
  }

  /**
   * Reads, parses, and registers a single file, then recurses into its `include:` list.
   * Already-visited (resolved) paths are skipped.
   * @param {string} filePath The file path to read (relative or absolute).
   * @param {object} [options={}] Additional options.
   * @param {boolean} [options.isEntry=false] Whether this is the entry file.
   * @returns {void}
   * @private
   */
  #collect(filePath, { isEntry = false } = {}) {
    const resolvedPath = path.resolve(filePath);
    if (this.#visited.has(resolvedPath)) return;
    this.#visited.add(resolvedPath);

    const raw = this.#readYaml(resolvedPath, isEntry);
    const namespace = raw?.namespace ?? 'default';

    this.#files.push({
      namespace,
      resources: raw?.resources,
      clients: raw?.clients,
      filePath: resolvedPath,
    });

    if (isEntry) this.#entryRaw = raw;

    this.#resolveIncludes(raw, resolvedPath);
  }

  /**
   * Resolves and recurses into every path listed under the file's `include:` key.
   * @param {object} raw The file's raw parsed YAML object.
   * @param {string} currentFilePath The absolute path of the file declaring the includes.
   * @returns {void}
   * @private
   */
  #resolveIncludes(raw, currentFilePath) {
    const includes = raw?.include ?? [];
    const dir = path.dirname(currentFilePath);

    includes.forEach((includePath) => {
      const resolvedIncludePath = path.isAbsolute(includePath) ? includePath : path.join(dir, includePath);
      this.#collect(resolvedIncludePath);
    });
  }

  /**
   * Reads and YAML-parses a configuration file, resolving env var references.
   * @param {string} filePath The absolute file path to read.
   * @param {boolean} isEntry Whether this is the entry file (affects the exception raised).
   * @returns {object} The parsed YAML object.
   * @throws {ConfigurationFileNotFound} If the entry file cannot be read.
   * @throws {ConfigurationIncludeNotFound} If an included file cannot be read.
   * @private
   */
  #readYaml(filePath, isEntry) {
    try {
      const content = readFileSync(filePath, 'utf8');
      return YAML.parse(EnvStringResolver.resolve(content));
    } catch {
      Logger.error(`Configuration file not found: ${filePath}`);
      throw isEntry ? new ConfigurationFileNotFound(filePath) : new ConfigurationIncludeNotFound(filePath);
    }
  }
}

export { ConfigIncluder };
