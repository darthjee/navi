import { AppError } from '../AppError.js';

/**
 * Thrown when a `parser` config entry declares a `type` other than the
 * supported set (`regex`, `json_path`, `css`), or omits `type` entirely.
 * @author darthjee
 */
class InvalidParserType extends AppError {
  constructor(type) {
    super(`Invalid parser type: ${JSON.stringify(type)}. Expected one of "regex", "json_path", "css"`);

    this.type = type;
  }
}

export { InvalidParserType };
