import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when an `emit` config entry declares a non-numeric or negative `cooldown` value.
 * @author darthjee
 */
class InvalidEmitCooldown extends AppError {
  constructor(cooldown) {
    super(`Invalid emit cooldown: ${JSON.stringify(cooldown)}. Expected a non-negative number`);

    this.cooldown = cooldown;
  }
}

export { InvalidEmitCooldown };
