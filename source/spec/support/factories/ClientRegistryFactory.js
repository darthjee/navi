import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { ClientFactory } from './ClientFactory.js';

/**
 * Factory for creating ClientRegistry instances in tests.
 */
class ClientRegistryFactory {
  /**
   * Builds a ClientRegistry instance.
   * @param {object} [clientsMap] - Optional map of name to Client. Defaults to { default: ClientFactory.build() }.
   * @returns {ClientRegistry} A new ClientRegistry instance.
   */
  static build(clientsMap = { default: ClientFactory.build() }) {
    return new ClientRegistry(clientsMap);
  }
}

export { ClientRegistryFactory };
