import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when an `emit` config entry declares a `body_template` value that is not a
 * plain object or array.
 * @author darthjee
 */
class InvalidEmitBodyTemplate extends AppError {
  constructor(bodyTemplate) {
    super(`Invalid emit body_template: ${JSON.stringify(bodyTemplate)}. Expected a plain object or array`);

    this.bodyTemplate = bodyTemplate;
  }
}

export { InvalidEmitBodyTemplate };
