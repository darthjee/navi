import { ResourceNotFound } from '../exceptions/ResourceNotFound.js';
import { NamedRegistry } from './NamedRegistry.js';

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