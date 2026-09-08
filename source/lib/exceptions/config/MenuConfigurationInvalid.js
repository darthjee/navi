import { AppError } from '../../common/exceptions/AppError.js';

/**
 * MenuConfigurationInvalid is thrown when the menu configuration file cannot be
 * parsed, or parses to a document whose `entries` key is present but is not a
 * list. Startup is aborted fail-fast, matching the `ConfigIncluder` posture on a
 * broken main configuration file.
 * @author darthjee
 */
class MenuConfigurationInvalid extends AppError {
  /**
   * @param {string} file - Path to the offending menu configuration file.
   * @param {string} [reason] - Optional detail about why the file is invalid.
   */
  constructor(file, reason) {
    super(`Invalid menu configuration file: ${file}${reason ? ` (${reason})` : ''}`);
    this.name = 'MenuConfigurationInvalid';
    this.file = file;
    this.reason = reason;
  }
}

export { MenuConfigurationInvalid };
