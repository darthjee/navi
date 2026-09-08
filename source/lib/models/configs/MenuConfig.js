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
 * - `hidden: true` on a known default route suppresses that default; on any
 *   other route it is dropped with a `Logger.warn`.
 * - A non-hidden custom entry re-listing a known default route repositions that
 *   default to the custom file position (its `text`, or the shipped label when
 *   omitted).
 * - Duplicate routes in the merged render list are dropped first-wins with a
 *   `Logger.warn`.
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

    return this.#resolve(defaultBlock, rawEntries);
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
   * Runs the full SPEC-2 resolution pipeline: validate, partition `hidden`,
   * reposition re-listed defaults, merge, then first-wins de-dup.
   * @param {Array<MenuEntry>} defaultBlock - The shipped default block.
   * @param {Array<*>} rawEntries - The raw `entries` list.
   * @returns {Array<MenuEntry>} The resolved menu entries, in render order.
   */
  static #resolve(defaultBlock, rawEntries) {
    const valid = this.#collectValid(rawEntries);
    const { suppressed, visible } = this.#partitionHidden(valid);
    const repositioned = new Set(
      visible.map((raw) => raw.route).filter((route) => this.DEFAULT_ROUTES.includes(route)),
    );
    const keptDefaults = defaultBlock.filter(
      (entry) => !suppressed.has(entry.route) && !repositioned.has(entry.route),
    );
    const customBlock = visible.map((raw) => this.#customEntry(raw));

    return this.#dedupe([...keptDefaults, ...customBlock]);
  }

  /**
   * Validates each raw entry, dropping and warning on invalid ones. The
   * `entries`-array index is kept for the warning wording.
   * @param {Array<*>} rawEntries - The raw `entries` list.
   * @returns {Array<{ entry: object, index: number }>} The valid raw entries.
   */
  static #collectValid(rawEntries) {
    return rawEntries.reduce((valid, rawEntry, index) => {
      const { valid: ok, reason } = MenuEntry.validate(rawEntry);

      if (!ok) {
        Logger.warn(`[menu] skipping invalid entry at index ${index}: ${reason}`);
        return valid;
      }

      valid.push({ entry: rawEntry, index });
      return valid;
    }, []);
  }

  /**
   * Partitions the valid raw entries into suppressed default routes and the
   * visible entries, warning on `hidden` used on a non-default route.
   * @param {Array<{ entry: object, index: number }>} valid - The valid raw entries.
   * @returns {{ suppressed: Set<string>, visible: Array<object> }} The partition.
   */
  static #partitionHidden(valid) {
    const suppressed = new Set();

    const visible = valid.reduce((list, { entry, index }) => {
      if (entry.hidden !== true) {
        list.push(entry);
        return list;
      }

      if (this.DEFAULT_ROUTES.includes(entry.route)) {
        suppressed.add(entry.route);
        return list;
      }

      Logger.warn(
        `[menu] skipping entry at index ${index}: "hidden" is only valid on a default route`,
      );
      return list;
    }, []);

    return { suppressed, visible };
  }

  /**
   * Builds a {@link MenuEntry} from a visible raw entry, restoring the shipped
   * label when a re-listed default omits its `text`.
   * @param {object} raw - The visible raw entry.
   * @returns {MenuEntry} The built entry.
   */
  static #customEntry(raw) {
    if (!this.DEFAULT_ROUTES.includes(raw.route) || 'text' in raw) {
      return MenuEntry.fromObject(raw);
    }

    return MenuEntry.fromObject(raw, this.defaultLabel(raw.route));
  }

  /**
   * First-wins de-dup over the merged render-order list. Indices in the warning
   * count positions in that merged list, not the raw file.
   * @param {Array<MenuEntry>} merged - The merged render-order list.
   * @returns {Array<MenuEntry>} The survivors, in order.
   */
  static #dedupe(merged) {
    const firstIndex = new Map();

    return merged.reduce((kept, entry, index) => {
      if (firstIndex.has(entry.route)) {
        Logger.warn(
          `[menu] skipping duplicate entry at index ${index}: `
          + `route "${entry.route}" already defined at index ${firstIndex.get(entry.route)}`,
        );
        return kept;
      }

      firstIndex.set(entry.route, index);
      kept.push(entry);
      return kept;
    }, []);
  }
}

export { MenuConfig };
