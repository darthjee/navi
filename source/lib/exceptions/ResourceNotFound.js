import { ItemNotFound } from './ItemNotFound.js';

/**
 * ResourceNotFound is a custom error class thrown when a requested resource
 * cannot be found in config.
 * @author darthjee
 */
class ResourceNotFound extends ItemNotFound {
  constructor(resourceName) {
    super(resourceName, { itemType: 'Resource' });

    this.resourceName = resourceName;
  }
}

export { ResourceNotFound };
