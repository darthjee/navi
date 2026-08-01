import { ClientFactory } from './ClientFactory.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';

/**
 * Factory for creating NamespaceMap instances in tests.
 */
class NamespaceMapFactory {
  /**
   * Builds a NamespaceMap instance (instance-mode, bypassing the static singleton facade).
   * @param {object} [params={}] - Optional attributes.
   * @param {Record<string, Resource>} [params.resources={}] - Resources for the built namespace.
   * @param {Record<string, Client>} [params.clients] - Clients for the built namespace.
   * Defaults to `{ default: ClientFactory.build() }`.
   * @param {string} [params.namespace='default'] - The namespace name to build.
   * @returns {NamespaceMap} A new NamespaceMap instance.
   */
  static build({ resources = {}, clients = { default: ClientFactory.build() }, namespace = 'default' } = {}) {
    return new NamespaceMap({
      [namespace]: new Namespace({ name: namespace, resources, clients }),
    });
  }
}

export { NamespaceMapFactory };
