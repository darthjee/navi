import { AppError } from './AppError.js';

/**
 * ForbiddenError is thrown when a request is rejected due to a security
 * violation, such as a path traversal attempt.
 * @author darthjee
 */
class ForbiddenError extends AppError {
  constructor() {
    super('Forbidden');
  }
}

export { ForbiddenError };
