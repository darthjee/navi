import { ItemNotFound } from './ItemNotFound.js';

/**
 * NamespaceNotFound is a custom error class thrown when a requested namespace
 * cannot be found in the NamespaceMap.
 * @author darthjee
 */
class NamespaceNotFound extends ItemNotFound {
  constructor(namespaceName) {
    super(namespaceName, { itemType: 'Namespace' });

    this.namespaceName = namespaceName;
  }
}

export { NamespaceNotFound };
