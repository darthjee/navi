import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when an `emit` config entry declares a `method` other than the
 * supported set (`POST`, `PUT`, `PATCH`), or omits `method` entirely.
 * @author darthjee
 */
class InvalidEmitMethod extends AppError {
  constructor(method) {
    super(`Invalid emit method: ${JSON.stringify(method)}. Expected one of "POST", "PUT", "PATCH"`);

    this.method = method;
  }
}

export { InvalidEmitMethod };
