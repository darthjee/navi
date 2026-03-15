import { AppError } from './AppError.js';

class ConfigurationFileNotFound extends AppError {
  constructor(file) {
    super(`Configuration file not found: ${file}`);
    this.name = 'ConfigurationFileNotFound';
  }
}

export { ConfigurationFileNotFound };
