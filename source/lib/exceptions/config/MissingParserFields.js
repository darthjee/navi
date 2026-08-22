import { AppError } from '../AppError.js';

/**
 * Thrown when a parser config entry is missing the required "fields" mapping.
 * @author darthjee
 */
class MissingParserFields extends AppError {
  constructor() {
    super('Parser is missing the required "fields" field');
  }
}

export { MissingParserFields };
