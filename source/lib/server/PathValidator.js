import path from 'path';
import { ForbiddenError } from '../exceptions/ForbiddenError.js';

/**
 * Validates that a resolved file path stays within an allowed base directory,
 * preventing path traversal attacks.
 * @author darthjee
 */
class PathValidator {
  #baseDir;

  /**
   * @param {string} baseDir - The absolute path of the allowed base directory.
   */
  constructor(baseDir) {
    this.#baseDir = baseDir;
  }

  /**
   * Returns true if the given resolved path is safely inside the base directory.
   * @param {string} resolvedPath - The already-resolved absolute path to validate.
   * @returns {boolean} Whether the path is within the allowed base directory.
   */
  isValid(resolvedPath) {
    return resolvedPath.startsWith(this.#baseDir + path.sep);
  }

  /**
   * Throws a ForbiddenError if the given resolved path escapes the base directory.
   * @param {string} resolvedPath - The already-resolved absolute path to validate.
   * @returns {void}
   * @throws {ForbiddenError} If the path attempts to escape the base directory.
   */
  validate(resolvedPath) {
    if (!this.isValid(resolvedPath)) {
      throw new ForbiddenError();
    }
  }
}

export { PathValidator };
