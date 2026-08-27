import { AppError } from '../../common/exceptions/AppError.js';

/**
 * NotFoundError is thrown when a requested resource cannot be found.
 * @author darthjee
 */
class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message);
  }
}

export { NotFoundError };
