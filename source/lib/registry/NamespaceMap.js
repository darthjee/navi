import { NamedRegistry } from './NamedRegistry.js';
import { ClientNotFound } from '../exceptions/registry/ClientNotFound.js';
import { NamespaceNotFound } from '../exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../exceptions/registry/ResourceNotFound.js';
import { NamespaceMapBuilder } from '../services/NamespaceMapBuilder.js';

const DEFAULT_NAMESPACE = 'default';

/**
 * NamespaceMap resolves resource/client references across namespaces.
 *
 * Implements a static singleton facade: call `NamespaceMap.build(namespaces)` once
 * during application bootstrap, then use static delegation methods (`getResource`,
 * `getClient`, `getNamespace`, `include`) to access it. Use `NamespaceMap.reset()` in
 * tests to restore a clean state between examples.
 *
 * `include(files)` (instance and static) reuses `NamespaceMapBuilder`'s merge/validation
 * logic to add or update a namespace's resources/clients into the running map, after
 * boot, with the same fail-fast guarantees boot-time loading already has.
 *
 * Resolution rules:
 * - When an explicit target namespace is given and it (or the item within it) cannot
 *   be found, the lookup fails immediately — no fallback is attempted.
 * - When no explicit target namespace is given, the lookup is first attempted in the
 *   requester's own namespace (`originNamespace`), then falls back to the `default`
 *   namespace.
 * @author darthjee
 */
class NamespaceMap extends NamedRegistry {
  /**
   * The exception class to throw when a namespace is not found.
   * @see NamespaceNotFound
   * @type {class}
   */
  static notFoundException = NamespaceNotFound;

  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {Record<string, Namespace>} namespaces - A map of namespace names to Namespace instances.
   * @returns {NamespaceMap} The created instance.
   * @throws {Error} If `build()` has already been called without a preceding `reset()`.
   */
  static build(namespaces) {
    if (NamespaceMap.#instance) {
      throw new Error('NamespaceMap.build() has already been called. Call reset() first.');
    }
    NamespaceMap.#instance = new NamespaceMap(namespaces);
    return NamespaceMap.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    NamespaceMap.#instance = null;
  }

  /**
   * Resolves a resource from the singleton instance.
   * @param {string} originNamespace The namespace of the requester.
   * @param {string} name The resource name.
   * @param {string|null} [namespace=null] Explicit target namespace, or null to resolve
   * against `originNamespace` (falling back to `default`).
   * @returns {Resource} The resolved resource.
   * @throws {Error} If `build()` has not been called.
   */
  static getResource(originNamespace, name, namespace = null) {
    return NamespaceMap.#getInstance().getResource(originNamespace, name, namespace);
  }

  /**
   * Resolves a client from the singleton instance.
   * @param {string} originNamespace The namespace of the requester.
   * @param {string} name The client name.
   * @param {string|null} [namespace=null] Explicit target namespace, or null to resolve
   * against `originNamespace` (falling back to `default`).
   * @returns {Client} The resolved client.
   * @throws {Error} If `build()` has not been called.
   */
  static getClient(originNamespace, name, namespace = null) {
    return NamespaceMap.#getInstance().getClient(originNamespace, name, namespace);
  }

  /**
   * Returns a namespace, by name, from the singleton instance.
   * @param {string} name The namespace name.
   * @returns {Namespace} The resolved namespace.
   * @throws {NamespaceNotFound} When the namespace cannot be found.
   * @throws {Error} If `build()` has not been called.
   */
  static getNamespace(name) {
    return NamespaceMap.#getInstance().getItem(name);
  }

  /**
   * Merges the given files' resources/clients into the singleton instance, reusing
   * `NamespaceMapBuilder`'s merge and cross-reference validation logic.
   * @param {Array<{namespace: string, resources: object, clients: object, filePath: string}>} files
   * The flat list of files (see `ConfigIncluder`).
   * @returns {NamespaceMap} The singleton instance.
   * @throws {NamespaceNotFound|ResourceNotFound|ClientNotFound} When a resource/client
   * reference cannot be resolved.
   * @throws {Error} If `build()` has not been called.
   */
  static include(files) {
    return NamespaceMap.#getInstance().include(files);
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {NamespaceMap} The singleton instance.
   * @throws {Error} If `build()` has not been called.
   */
  static #getInstance() {
    if (!NamespaceMap.#instance) {
      throw new Error('NamespaceMap has not been built. Call NamespaceMap.build() first.');
    }
    return NamespaceMap.#instance;
  }

  /**
   * Resolves a resource, given the requester's namespace, the resource name, and
   * an optional explicit target namespace.
   * @param {string} originNamespace The namespace of the requester.
   * @param {string} name The resource name.
   * @param {string|null} [namespace=null] Explicit target namespace, or null to resolve
   * against `originNamespace` (falling back to `default`).
   * @returns {Resource} The resolved resource.
   * @throws {NamespaceNotFound} When the target/origin/default namespace cannot be found.
   * @throws {ResourceNotFound} When the resource cannot be found in the resolved namespace(s).
   */
  getResource(originNamespace, name, namespace = null) {
    return this.#resolve(originNamespace, name, namespace, {
      registryKey: 'resourceRegistry',
      method: 'getItem',
      NotFoundError: ResourceNotFound,
    });
  }

  /**
   * Resolves a client, given the requester's namespace, the client name, and
   * an optional explicit target namespace.
   * @param {string} originNamespace The namespace of the requester.
   * @param {string} name The client name.
   * @param {string|null} [namespace=null] Explicit target namespace, or null to resolve
   * against `originNamespace` (falling back to `default`).
   * @returns {Client} The resolved client.
   * @throws {NamespaceNotFound} When the target/origin/default namespace cannot be found.
   * @throws {ClientNotFound} When the client cannot be found in the resolved namespace(s).
   */
  getClient(originNamespace, name, namespace = null) {
    return this.#resolve(originNamespace, name, namespace, {
      registryKey: 'clientRegistry',
      method: 'getClient',
      NotFoundError: ClientNotFound,
    });
  }

  /**
   * Merges the given files' resources/clients into this namespace map, creating
   * new namespaces and/or extending or replacing items in already-existing ones,
   * reusing the same merge/validation logic used at boot.
   * @param {Array<{namespace: string, resources: object, clients: object, filePath: string}>} files
   * The flat list of files (see `ConfigIncluder`).
   * @returns {NamespaceMap} this, for chaining.
   * @throws {NamespaceNotFound|ResourceNotFound|ClientNotFound} When a resource/client
   * reference cannot be resolved.
   */
  include(files) {
    const namespaces = NamespaceMapBuilder.build(files, this.items);
    this.replaceItems(namespaces);
    return this;
  }

  /**
   * Resolves an item (resource or client) using the namespace resolution rules.
   * @param {string} originNamespace The namespace of the requester.
   * @param {string} name The item name.
   * @param {string|null} namespace Explicit target namespace, or null/undefined.
   * @param {object} strategy Lookup strategy.
   * @param {string} strategy.registryKey Either 'resourceRegistry' or 'clientRegistry'.
   * @param {string} strategy.method Either 'getItem' or 'getClient'.
   * @param {class} strategy.NotFoundError The exception class raised by the underlying registry.
   * @returns {*} The resolved item.
   * @throws {NamespaceNotFound} When the relevant namespace cannot be found.
   * @private
   */
  #resolve(originNamespace, name, namespace, { registryKey, method, NotFoundError }) {
    if (namespace) {
      const explicitNamespace = this.getItem(namespace);
      return explicitNamespace[registryKey][method](name);
    }

    const originResult = this.#tryResolve(originNamespace, name, { registryKey, method, NotFoundError });
    if (originResult !== undefined) return originResult;

    const defaultNamespace = this.getItem(DEFAULT_NAMESPACE);
    return defaultNamespace[registryKey][method](name);
  }

  /**
   * Attempts to resolve an item within a given namespace without raising when the
   * namespace or item is missing.
   * @param {string} namespaceName The namespace to look into.
   * @param {string} name The item name.
   * @param {object} strategy Lookup strategy (see {@link #resolve}).
   * @param {string} strategy.registryKey Either 'resourceRegistry' or 'clientRegistry'.
   * @param {string} strategy.method Either 'getItem' or 'getClient'.
   * @param {class} strategy.NotFoundError The exception class raised by the underlying registry.
   * @returns {*|undefined} The resolved item, or undefined when it could not be resolved.
   * @private
   */
  #tryResolve(namespaceName, name, { registryKey, method, NotFoundError }) {
    if (!this.has(namespaceName)) return undefined;

    try {
      return this.getItem(namespaceName)[registryKey][method](name);
    } catch (error) {
      if (error instanceof NotFoundError) return undefined;
      throw error;
    }
  }
}

export { NamespaceMap };
