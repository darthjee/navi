import { ItemNotFound } from './ItemNotFound.js';

/**
 * ParserNotFound is a custom error class thrown when a requested parser
 * cannot be found in the registry.
 * @author darthjee
 */
class ParserNotFound extends ItemNotFound {
  constructor(type) {
    super(type, { itemType: 'Parser' });

    this.type = type;
  }
}

export { ParserNotFound };
