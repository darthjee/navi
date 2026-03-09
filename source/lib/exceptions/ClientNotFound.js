import { ItemNotFound } from '../exceptions/ItemNotFound.js';

/**
 * ClientNotFound is a custom error class thrown when a requested client
 * cannot be found in config.
 * @author darthjee
 */
class ClientNotFound extends ItemNotFound {
  constructor(clientName) {
    super(clientName, { itemType: 'Client' });

    this.clientName = clientName;
  }
}

export { ClientNotFound };
