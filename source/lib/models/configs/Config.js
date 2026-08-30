import { EmitConfig } from './EmitConfig.js';
import { ExtractionConfig } from './ExtractionConfig.js';
import { LogConfig } from './LogConfig.js';
import { NamespaceNotFound } from '../../exceptions/registry/NamespaceNotFound.js';
import { NamespaceMap } from '../../registry/NamespaceMap.js';
import { ResourceRegistry } from '../../registry/ResourceRegistry.js';
import { ConfigLoader } from '../../services/config/ConfigLoader.js';

const DEFAULT_NAMESPACE = 'default';

/**
 * Config is a class that represents the configuration for the application.
 * It includes the namespace map (resources/clients, grouped by namespace) that is
 * to be included in the configuration.
 * @author darthjee
 */
class Config {
  /**
   * @param {object} params initialization parameters for the Config instance.
   * @param {Record<string, Namespace>} params.namespaceMap - A mapping of namespace name to Namespace instance.
   * @param {WorkersConfig} params.workersConfig - The configuration for worker instances.
   * @param {WebConfig|null} [params.webConfig] - Optional web server configuration.
   * @param {LogConfig} [params.logConfig] - Optional log configuration.
   * @param {EmitConfig} [params.emitConfig] - Optional emission-tracking configuration.
   * @param {ExtractionConfig} [params.extractionConfig] - Optional extraction-tracking configuration.
   * @param {FailureConfig|null} [params.failureConfig] - Optional failure threshold configuration.
   */
  constructor({
    namespaceMap, workersConfig, webConfig, logConfig, emitConfig, extractionConfig, failureConfig
  }) {
    this.namespaceMap = NamespaceMap.build(namespaceMap);

    this.workersConfig = workersConfig;
    this.webConfig = webConfig ?? null;
    this.logConfig = logConfig ?? new LogConfig();
    this.emitConfig = emitConfig ?? new EmitConfig();
    this.extractionConfig = extractionConfig ?? new ExtractionConfig();
    this.failureConfig = failureConfig ?? null;
  }

  /**
   * Returns the current default namespace's resource registry, resolved live
   * from the `namespaceMap` singleton on every access. Falls back to an empty
   * `ResourceRegistry` when there is no `default` namespace.
   * @returns {ResourceRegistry} The default namespace's resource registry.
   */
  get resourceRegistry() {
    try {
      return this.namespaceMap.getItem(DEFAULT_NAMESPACE).resourceRegistry;
    } catch (error) {
      if (error instanceof NamespaceNotFound) return new ResourceRegistry({});
      throw error;
    }
  }

  /**
   * Returns the resource identified by the given name, resolved as if the caller
   * originated from the `default` namespace.
   *
   * @param {string} name The name of the resource to retrieve.
   * @param {string|null} [namespace=null] Explicit target namespace, or null to resolve
   * against `default` (falling back to `default` again when not found there either).
   * @returns {Resource} The matching Resource instance.
   * @throws {Error} Throws when no resource with the given name exists.
   */
  getResource(name, namespace = null) {
    return this.namespaceMap.getResource(DEFAULT_NAMESPACE, name, namespace);
  }

  /**
   * Returns the client identified by the given name, resolved as if the caller
   * originated from the `default` namespace.
   *
   * When `name` is `"default"` or not provided, the method first tries to
   * return the client registered under the `"default"` key.  If no such
   * client exists but exactly one client is registered (under any name),
   * that single client is returned instead.
   *
   * @see ClientRegistry#getClient for the client retrieval logic.
   *
   * @param {string} [name] The name of the client to retrieve.
   * @param {string|null} [namespace=null] Explicit target namespace, or null to resolve
   * against `default` (falling back to `default` again when not found there either).
   * @returns {Client} The matching Client instance.
   * @throws {ClientNotFound} Throws when the named or default client is not found.
   */
  getClient(name, namespace = null) {
    return this.namespaceMap.getClient(DEFAULT_NAMESPACE, name, namespace);
  }

  /**
   * Creates a Config instance from a YAML file.
   *
   * @param {string} filePath Path to the YAML configuration file.
   * @returns {Config} A new Config instance.
   *
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @throws {MissingTopLevelConfigKey} Throws when the file is invalid or does not contain required keys.
   */
  static fromFile(filePath) {
    return new Config( ConfigLoader.fromFile(filePath) );
  }
}

export { Config };
