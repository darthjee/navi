import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when an `emit` config entry declares a `headers` value that is not a plain
 * object mapping keys to string-coercible values.
 * @author darthjee
 */
class InvalidEmitHeaders extends AppError {
  constructor(headers) {
    super(`Invalid emit headers: ${JSON.stringify(headers)}. Expected a map of string values`);

    this.headers = headers;
  }
}

export { InvalidEmitHeaders };
