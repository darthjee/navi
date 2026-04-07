import { AppError } from './AppError.js';

/**
 * Thrown when a parsed response body is null.
 * @author darthjee
 */
class NullResponse extends AppError {
  constructor() {
    super('Response body is null');
  }
}

export { NullResponse };
