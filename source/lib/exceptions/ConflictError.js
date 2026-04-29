import { AppError } from './AppError.js';

/**
 * ConflictError is thrown when a requested state transition is not valid
 * given the current application state (e.g. pausing an already-paused engine).
 * @author darthjee
 */
class ConflictError extends AppError {
  constructor() {
    super('Conflict');
  }
}

export { ConflictError };
