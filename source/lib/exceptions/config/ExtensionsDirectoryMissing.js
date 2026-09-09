import { AppError } from '../../common/exceptions/AppError.js';

/**
 * ExtensionsDirectoryMissing is thrown when extensions are enabled but
 * `NAVI_EXTENSIONS_DIR` is unset, does not exist, or is not a directory.
 * Startup is aborted fail-fast, mirroring `MenuConfigurationInvalid`'s posture
 * on a broken configuration root.
 * @author darthjee
 */
class ExtensionsDirectoryMissing extends AppError {
  /**
   * @param {string} dir - The offending extensions directory path.
   */
  constructor(dir) {
    super(`Extensions are enabled but the extensions directory is missing: ${dir}`);
    this.name = 'ExtensionsDirectoryMissing';
    this.dir = dir;
  }
}

export { ExtensionsDirectoryMissing };
