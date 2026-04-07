import { AppError } from './AppError.js';

/**
 * Thrown when an action config entry is missing the required "resource" field.
 * @author darthjee
 */
class MissingActionResource extends AppError {
  constructor() {
    super('Action is missing the required "resource" field');
  }
}

export { MissingActionResource };
