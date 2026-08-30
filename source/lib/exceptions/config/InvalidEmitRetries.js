import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when an `emit` config entry declares a non-numeric or negative `retries` value.
 * `retries: 0` is valid (one attempt, no retries).
 * @author darthjee
 */
class InvalidEmitRetries extends AppError {
  constructor(retries) {
    super(`Invalid emit retries: ${JSON.stringify(retries)}. Expected a non-negative number`);

    this.retries = retries;
  }
}

export { InvalidEmitRetries };
