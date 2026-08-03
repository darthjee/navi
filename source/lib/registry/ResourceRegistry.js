import { NamedRegistry } from './NamedRegistry.js';
import { ResourceNotFound } from '../exceptions/registry/ResourceNotFound.js';

/**
 * Registry of named Resource instances.
 *
 * A plain `NamedRegistry` subclass, used as a per-namespace instance inside
 * `Namespace`. Resolution across namespaces is done via `NamespaceMap`.
 * @author darthjee
 * @augments NamedRegistry
 */
class ResourceRegistry extends NamedRegistry {
  /**
   * The exception class to throw when a resource is not found.
   * @see ResourceNotFound
   * @type {class}
   * @see NamedRegistry#notFound
   * @see NamedRegistry#notFoundException
   */
  static notFoundException = ResourceNotFound;
}

export { ResourceRegistry };
