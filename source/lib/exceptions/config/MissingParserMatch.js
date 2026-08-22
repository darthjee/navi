import { AppError } from '../AppError.js';

/**
 * Thrown when a `regex` parser config entry is missing the required "match" field.
 * @author darthjee
 */
class MissingParserMatch extends AppError {
  constructor() {
    super('Regex parser is missing the required "match" field');
  }
}

export { MissingParserMatch };
