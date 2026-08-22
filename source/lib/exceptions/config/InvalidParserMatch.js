import { AppError } from '../AppError.js';

/**
 * Thrown when a parser's `match` attribute is present but resolving it against
 * the parsed body does not yield an array (a key missing anywhere along the
 * dot-notation path, or a resolved value that isn't an array).
 * @author darthjee
 */
class InvalidParserMatch extends AppError {
  constructor(match) {
    super(`Parser "match" (${JSON.stringify(match)}) did not resolve to an array`);

    this.match = match;
  }
}

export { InvalidParserMatch };
