import { AppError } from './AppError.js';

/**
 * Thrown when a parameters path expression cannot be resolved against the response wrapper.
 * @author darthjee
 */
class MissingMappingVariable extends AppError {
  /**
   * @param {string} variable The name of the missing source field.
   */
  constructor(variable) {
    super(`Missing variable in response: ${variable}`);
    this.variable = variable;
  }
}

export { MissingMappingVariable };
