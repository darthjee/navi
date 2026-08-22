import { AppError } from '../AppError.js';

/**
 * Thrown when an `emit` config entry is missing the required "url" field.
 * @author darthjee
 */
class MissingEmitUrl extends AppError {
  constructor() {
    super('Emit is missing the required "url" field');
  }
}

export { MissingEmitUrl };
