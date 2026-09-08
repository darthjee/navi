import { existsSync, readFileSync } from 'node:fs';
import YAML from 'yaml';
import { EnvStringResolver } from '../../common/utils/env_resolver/EnvStringResolver.js';
import { Logger } from '../../common/utils/logging/Logger.js';
import { MenuConfigurationInvalid } from '../../exceptions/config/MenuConfigurationInvalid.js';
import { MenuEntry } from './MenuEntry.js';

/**
 * Loads and validates the internal navigation menu configuration file into a
 * list of {@link MenuEntry} instances.
 *
 * Behaviour (see the IMPL-1 shared contract):
 * - Missing / empty / whitespace-only file, or a document without an `entries`
 *   key, falls back to {@link MenuConfig.DEFAULT_ENTRIES}.
 * - An explicit `entries: []` yields an empty menu.
 * - A YAML parse failure, or an `entries` value that is present but not a list,
 *   throws {@link MenuConfigurationInvalid} (fail-fast at startup).
 * - Individual malformed entries are dropped with a `Logger.warn`.
 * @author darthjee
 */
class MenuConfig {
  /**
   * In-code fallback used when the menu file is absent or empty.
   * @returns {Array<MenuEntry>} The default Logs + Memory menu.
   */
  static get DEFAULT_ENTRIES() {
    return [
      new MenuEntry({ route: '/logs', text: 'Logs' }),
      new MenuEntry({ route: '/memory/status', text: 'Memory' }),
    ];
  }

  /**
   * Loads the menu entries from the given file path.
   * @param {string} path - Path to the menu configuration file.
   * @returns {Array<MenuEntry>} The validated menu entries, in file order.
   * @throws {MenuConfigurationInvalid} On an unparseable file or a non-list `entries`.
   */
  static fromFile(path) {
    if (!existsSync(path)) return this.DEFAULT_ENTRIES;

    const content = readFileSync(path, 'utf8');
    if (content.trim() === '') return this.DEFAULT_ENTRIES;

    const parsed = this.#parse(path, content);

    if (parsed === null || typeof parsed !== 'object' || !('entries' in parsed)) {
      return this.DEFAULT_ENTRIES;
    }

    if (!Array.isArray(parsed.entries)) {
      throw new MenuConfigurationInvalid(path, '"entries" must be a list');
    }

    return this.#buildEntries(parsed.entries);
  }

  /**
   * Resolves env vars and YAML-parses the file content.
   * @param {string} path - The file path (for the exception message).
   * @param {string} content - The raw file content.
   * @returns {*} The parsed document.
   * @throws {MenuConfigurationInvalid} When parsing fails.
   */
  static #parse(path, content) {
    try {
      const resolved = new EnvStringResolver(content).resolve();
      return YAML.parse(resolved);
    } catch (error) {
      throw new MenuConfigurationInvalid(path, error.message);
    }
  }

  /**
   * Validates each raw entry, dropping and warning on invalid ones.
   * @param {Array<*>} rawEntries - The raw `entries` list.
   * @returns {Array<MenuEntry>} The valid entries as models, in order.
   */
  static #buildEntries(rawEntries) {
    return rawEntries.reduce((entries, rawEntry, index) => {
      const { valid, reason } = MenuEntry.validate(rawEntry);

      if (!valid) {
        Logger.warn(`[menu] skipping invalid entry at index ${index}: ${reason}`);
        return entries;
      }

      entries.push(MenuEntry.fromObject(rawEntry));
      return entries;
    }, []);
  }
}

export { MenuConfig };
