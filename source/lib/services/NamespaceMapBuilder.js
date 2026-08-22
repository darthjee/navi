import { ConfigParser } from './ConfigParser.js';
import { Namespace } from '../registry/Namespace.js';
import { NamespaceMap } from '../registry/NamespaceMap.js';

/**
 * NamespaceMapBuilder groups the per-file `{ namespace, resources, clients }` entries
 * produced by `ConfigIncluder` into one `Namespace` per distinct namespace name, then
 * eagerly validates every resource/client reference collected while parsing (actions,
 * paginated_actions, and resource-level client references), so unresolvable
 * references fail fast at load time rather than at request time.
 *
 * When an `existingNamespaces` map is given, its namespaces' current resources/clients
 * are merged with the new `files`, so this same builder serves both boot-time loading
 * (no existing namespaces) and later additions into an already-running `NamespaceMap`.
 * @author darthjee
 */
class NamespaceMapBuilder {
  #files;
  #existingNamespaces;
  #strict;

  /**
   * @param {Array<{namespace: string, resources: object, clients: object, filePath: string}>} files
   * The flat list of files returned by `ConfigIncluder`.
   * @param {Record<string, Namespace>} [existingNamespaces={}] An already-built namespace
   * map to merge `files` into, replacing on name collision.
   */
  constructor(files, existingNamespaces = {}) {
    this.#files = files;
    this.#existingNamespaces = existingNamespaces;
    this.#strict = files.length === 1;
  }

  /**
   * Builds a namespace map from the given list of files, optionally merged into an
   * already-built namespace map.
   * @param {Array<{namespace: string, resources: object, clients: object, filePath: string}>} files
   * The flat list of files returned by `ConfigIncluder`.
   * @param {Record<string, Namespace>} [existingNamespaces={}] An already-built namespace
   * map to merge `files` into, replacing on name collision.
   * @returns {Record<string, Namespace>} A map of namespace name to Namespace instance.
   */
  static build(files, existingNamespaces = {}) {
    return new NamespaceMapBuilder(files, existingNamespaces).build();
  }

  /**
   * Groups files by namespace, builds one Namespace per group, and eagerly
   * validates every cross-reference before returning.
   * @returns {Record<string, Namespace>} A map of namespace name to Namespace instance.
   * @throws {NamespaceNotFound|ResourceNotFound|ClientNotFound} When a resource/client
   * reference cannot be resolved.
   */
  build() {
    const namespaces = this.#buildNamespaces();
    this.#validateReferences(namespaces);
    return namespaces;
  }

  /**
   * Groups every file's parsed resources/clients by namespace name (seeded from any
   * already-existing namespace's current items, replacing on name collision), then
   * builds one fresh Namespace per group.
   * @returns {Record<string, Namespace>} A map of namespace name to Namespace instance.
   * @private
   */
  #buildNamespaces() {
    const groups = this.#seedGroups();

    this.#files.forEach((file) => {
      const parsed = ConfigParser.fromObject(
        this.#fileConfig(file),
        { namespace: file.namespace, strict: this.#strict },
      );

      const group = groups[file.namespace] ??= { resources: {}, clients: {} };
      this.#mergeInto(group.resources, parsed.resources);
      this.#mergeInto(group.clients, parsed.clients);
    });

    return Object.fromEntries(
      Object.entries(groups).map(([name, { resources, clients }]) => {
        return [name, new Namespace({ name, resources, clients })];
      })
    );
  }

  /**
   * Seeds the groups accumulator from each already-existing namespace's current
   * resources/clients, so untouched namespaces are preserved and touched ones are
   * merged into rather than replaced wholesale.
   * @returns {Record<string, {resources: object, clients: object}>} The seeded groups accumulator.
   * @private
   */
  #seedGroups() {
    const groups = {};

    Object.entries(this.#existingNamespaces).forEach(([name, namespace]) => {
      groups[name] = {
        resources: { ...namespace.resourceRegistry.items },
        clients: { ...namespace.clientRegistry.items },
      };
    });

    return groups;
  }

  /**
   * Builds the plain config object handed to `ConfigParser`, omitting the
   * `resources`/`clients` keys entirely when the file did not declare them
   * (as opposed to declaring them empty), so strict-mode key validation
   * behaves correctly.
   * @param {{resources: object|undefined, clients: object|undefined}} file A file entry from `ConfigIncluder`.
   * @returns {object} A plain object with only the keys the file actually declared.
   * @private
   */
  #fileConfig(file) {
    const config = {};
    if (file.resources !== undefined) config.resources = file.resources;
    if (file.clients !== undefined) config.clients = file.clients;
    return config;
  }

  /**
   * Merges a file's parsed items into the namespace group's accumulator, replacing
   * (rather than raising) when an item name is already present — the last item
   * registered under a given name wins.
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

  /**
   * Walks every resource in every namespace and validates that its declared client
   * reference, emit.client reference, action targets, and paginated_action targets
   * all resolve via the namespace map, raising immediately on the first unresolvable reference.
   * @param {Record<string, Namespace>} namespaces A map of namespace name to Namespace instance.
   * @returns {void}
   * @private
   */
  #validateReferences(namespaces) {
    const namespaceMap = new NamespaceMap(namespaces);

    Object.values(namespaces).forEach((namespace) => {
      namespace.resourceRegistry.filter(() => true).forEach((resource) => {
        resource.resourceRequests.forEach((resourceRequest) => {
          this.#validateClient(resourceRequest, namespaceMap);
          this.#validateEmitClient(resourceRequest, namespaceMap);
          this.#validateActions(resourceRequest, namespaceMap);
        });
      });
    });
  }

  /**
   * Validates a ResourceRequest's declared client reference, when present.
   * @param {ResourceRequest} resourceRequest The resource request to validate.
   * @param {NamespaceMap} namespaceMap The namespace map used to resolve the reference.
   * @returns {void}
   * @private
   */
  #validateClient(resourceRequest, namespaceMap) {
    if (!resourceRequest.clientName) return;

    namespaceMap.getClient(resourceRequest.namespace, resourceRequest.clientName, resourceRequest.clientNamespace);
  }

  /**
   * Validates a ResourceRequest's declared `emit.client` reference, when `emit` is present.
   * @param {ResourceRequest} resourceRequest The resource request to validate.
   * @param {NamespaceMap} namespaceMap The namespace map used to resolve the reference.
   * @returns {void}
   * @private
   */
  #validateEmitClient(resourceRequest, namespaceMap) {
    if (!resourceRequest.emit) return;

    namespaceMap.getClient(resourceRequest.namespace, resourceRequest.emit.clientName, resourceRequest.emit.clientNamespace);
  }

  /**
   * Validates every action/paginated_action target resource declared on a ResourceRequest.
   * @param {ResourceRequest} resourceRequest The resource request to validate.
   * @param {NamespaceMap} namespaceMap The namespace map used to resolve references.
   * @returns {void}
   * @private
   */
  #validateActions(resourceRequest, namespaceMap) {
    resourceRequest.actions.forEach((action) => {
      namespaceMap.getResource(action.originNamespace, action.resource, action.namespace);
    });

    resourceRequest.paginatedActions.forEach((paginatedAction) => {
      namespaceMap.getResource(paginatedAction.originNamespace, paginatedAction.resource, paginatedAction.namespace);
    });
  }
}

export { NamespaceMapBuilder };
