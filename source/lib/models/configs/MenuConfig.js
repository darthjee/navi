import { existsSync, readFileSync } from 'node:fs';
import YAML from 'yaml';
import { MenuEntry } from './MenuEntry.js';
import { EnvStringResolver } from '../../common/utils/env_resolver/EnvStringResolver.js';
import { Logger } from '../../common/utils/logging/Logger.js';
import { MenuConfigurationInvalid } from '../../exceptions/config/MenuConfigurationInvalid.js';

const DEFAULT_LABELS = {
  '/logs': 'Logs',
  '/memory/status': 'Memory',
};

/**
 * Loads and validates the internal navigation menu configuration file into a
 * list of {@link MenuEntry} instances.
 *
 * Behaviour (see the IMPL-2 shared contract):
 * - Missing / empty / whitespace-only file, or a document carrying neither an
 *   `entries` nor a `defaults` key, falls back to
 *   {@link MenuConfig.DEFAULT_ENTRIES}.
 * - Operator `entries` are merged after the shipped default block; an explicit
 *   `entries: []` merges an empty custom list (defaults still render).
 * - A top-level `defaults: false` empties the shipped default block; a
 *   non-boolean `defaults` is ignored with a `Logger.warn` and treated as `true`.
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
   * Routes that identify a shipped default entry.
   * @returns {Array<string>} The known default routes, in shipped order.
   */
  static get DEFAULT_ROUTES() {
    return this.DEFAULT_ENTRIES.map((entry) => entry.route);
  }

  /**
   * Maps a known default `route` to its shipped display label so a bare
   * re-list can restore it.
   * @param {string} route - A route value.
   * @returns {(string|undefined)} The shipped label, or undefined when the
   *   route is not a known default.
   */
  static defaultLabel(route) {
    return DEFAULT_LABELS[route];
  }

  /**
   * Loads the menu entries from the given file path.
   * @param {string} path - Path to the menu configuration file.
   * @returns {Array<MenuEntry>} The resolved menu entries, in render order.
   * @throws {MenuConfigurationInvalid} On an unparseable file or a non-list `entries`.
   */
  static fromFile(path) {
    if (!existsSync(path)) return this.DEFAULT_ENTRIES;

    const content = readFileSync(path, 'utf8');
    if (content.trim() === '') return this.DEFAULT_ENTRIES;

    const parsed = this.#parse(path, content);

    if (parsed === null || typeof parsed !== 'object') {
      return this.DEFAULT_ENTRIES;
    }

    const hasEntries = 'entries' in parsed;
    const hasDefaults = 'defaults' in parsed;

    if (!hasEntries && !hasDefaults) {
      return this.DEFAULT_ENTRIES;
    }

    if (hasEntries && !Array.isArray(parsed.entries)) {
      throw new MenuConfigurationInvalid(path, '"entries" must be a list');
    }

    const defaultBlock = this.#resolveDefaultBlock(parsed);
    const rawEntries = hasEntries ? parsed.entries : [];

    return this.#merge(defaultBlock, rawEntries);
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
   * Resolves the shipped default block from the top-level `defaults` key.
   * @param {object} parsed - The parsed menu document.
   * @returns {Array<MenuEntry>} The shipped default block for this load.
   */
  static #resolveDefaultBlock(parsed) {
    if (!('defaults' in parsed)) return this.DEFAULT_ENTRIES;

    const { defaults } = parsed;

    if (defaults === false) return [];
    if (defaults === true) return this.DEFAULT_ENTRIES;

    Logger.warn('[menu] ignoring non-boolean "defaults" value; treating as true');
    return this.DEFAULT_ENTRIES;
  }

  /**
   * Merges the shipped default block with the operator-supplied entries.
   * @param {Array<MenuEntry>} defaultBlock - The shipped default block.
   * @param {Array<*>} rawEntries - The raw `entries` list.
   * @returns {Array<MenuEntry>} The merged menu entries, in render order.
   */
  static #merge(defaultBlock, rawEntries) {
    return [...defaultBlock, ...this.#buildEntries(rawEntries)];
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
