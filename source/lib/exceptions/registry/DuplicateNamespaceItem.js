import { AppError } from '../AppError.js';

/**
 * DuplicateNamespaceItem is thrown when two files contributing to the same
 * namespace declare a resource or client under the same name.
 * @author darthjee
 */
class DuplicateNamespaceItem extends AppError {
  /**
   * @param {string} itemName - The duplicated resource/client name.
   * @param {object} attributes - Additional attributes describing the duplication.
   * @param {string} attributes.namespace - The namespace where the duplication happened.
   * @param {string} [attributes.itemType='Item'] - Either "resource" or "client".
   */
  constructor(itemName, { namespace, itemType = 'Item' } = {}) {
    super(`${itemType} "${itemName}" is already declared in namespace "${namespace}".`);
    this.itemName = itemName;
    this.namespace = namespace;
    this.itemType = itemType;
  }
}

export { DuplicateNamespaceItem };
