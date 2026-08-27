import { AppError } from '../../common/exceptions/AppError.js';

/**
 * Thrown when a parser config entry is missing the required "match" field.
 * @author darthjee
 */
class MissingParserMatch extends AppError {
  constructor() {
    super('Parser is missing the required "match" field');
  }
}

export { MissingParserMatch };
