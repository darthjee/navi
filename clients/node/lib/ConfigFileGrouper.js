import { ConfigFileParser } from './ConfigFileParser.js';

/**
 * ConfigFileGrouper parses an ordered list of `{ path, mode }` config file
 * entries (see `ConfigFileParser`) and groups the resulting `{ namespace,
 * resources, clients }` triples by namespace, preserving the order of first
 * appearance across the given list.
 *
 * Every entry is parsed up front, before any grouping happens: if any entry
 * fails to read/parse, the whole call fails fast and no partial grouping is
 * returned — mirroring the fan-out contract of `NaviClient#configFromFiles`
 * and friends (no `POST /api/config` calls happen for a partially-valid list).
 *
 * Same-namespace collisions are resolved last-file-wins, mirroring the
 * engine's own `source/lib/services/NamespaceMapBuilder.js#mergeInto` semantics.
 *
 * @author darthjee
 */
class ConfigFileGrouper {
  /**
   * Parses and groups the given ordered list of config file entries.
   *
   * @param {Array<{path: string, mode: 'json'|'yaml'|'auto'}>} entries The ordered
   * list of config file entries to parse and group.
   * @returns {Array<{namespace: string, resources: object, clients: object}>} One
   * entry per distinct namespace, in order of first appearance.
   * @throws {ConfigFileParseError} If any entry fails to read or parse.
   */
  static group(entries) {
    return new ConfigFileGrouper(entries).group();
  }

  /**
   * @param {Array<{path: string, mode: 'json'|'yaml'|'auto'}>} entries The ordered
   * list of config file entries to parse and group.
   */
  constructor(entries) {
    this.entries = entries;
  }

  /**
   * Parses and groups the given ordered list of config file entries.
   *
   * @returns {Array<{namespace: string, resources: object, clients: object}>} One
   * entry per distinct namespace, in order of first appearance.
   * @throws {ConfigFileParseError} If any entry fails to read or parse.
   */
  group() {
    const parsedFiles = this.entries.map(({ path, mode }) => { return ConfigFileParser.parse(path, mode); });

    return this.#groupByNamespace(parsedFiles);
  }

  /**
   * Groups the already-parsed files by namespace, preserving order of first
   * appearance, merging same-namespace resources/clients with last-file-wins semantics.
   *
   * @param {Array<{namespace: string, resources: object, clients: object}>} parsedFiles
   * The already-parsed, ordered list of files.
   * @returns {Array<{namespace: string, resources: object, clients: object}>} One
   * entry per distinct namespace, in order of first appearance.
   * @private
   */
  #groupByNamespace(parsedFiles) {
    const groups = new Map();

    parsedFiles.forEach(({ namespace, resources, clients }) => {
      const group = groups.get(namespace) ?? { namespace, resources: {}, clients: {} };
      this.#mergeInto(group.resources, resources);
      this.#mergeInto(group.clients, clients);
      groups.set(namespace, group);
    });

    return Array.from(groups.values());
  }

  /**
   * Merges a file's parsed items into the namespace group's accumulator, replacing
   * (rather than raising) when an item name is already present — the last item
   * registered under a given name wins.
   *
   * @param {object} target The namespace group's accumulator map.
   * @param {object} source The current file's parsed items.
   * @returns {void}
   * @private
   */
  #mergeInto(target, source) {
    Object.entries(source).forEach(([name, item]) => {
      target[name] = item;
    });
  }
}

export { ConfigFileGrouper };
