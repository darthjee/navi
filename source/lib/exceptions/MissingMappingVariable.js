import { AppError } from './AppError.js';

/**
 * Thrown when a variables_map references a field that is absent from the response item.
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
