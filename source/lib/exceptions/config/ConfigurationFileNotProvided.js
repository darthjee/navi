import { AppError } from '../../common/exceptions/AppError.js';

class ConfigurationFileNotProvided extends AppError {
  constructor() {
    super('Configuration file not provided. Please specify the configuration file path.');
    this.name = 'ConfigurationFileNotProvided';
  }
}

export { ConfigurationFileNotProvided };
