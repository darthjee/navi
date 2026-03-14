/**
 * AppError is the base class for all custom application errors.
 * It automatically assigns the error name from the subclass name.
 * @author darthjee
 */
class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export { AppError };
