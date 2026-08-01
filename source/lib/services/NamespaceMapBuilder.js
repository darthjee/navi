import { ConfigParser } from './ConfigParser.js';
import { DuplicateNamespaceItem } from '../exceptions/registry/DuplicateNamespaceItem.js';
import { Namespace } from '../registry/Namespace.js';
import { NamespaceMap } from '../registry/NamespaceMap.js';

/**
 * NamespaceMapBuilder groups the per-file `{ namespace, resources, clients }` entries
 * produced by `ConfigIncluder` into one `Namespace` per distinct namespace name, then
 * eagerly validates every resource/client reference collected while parsing (actions,
 * paginated_actions, and resource-level client references), so unresolvable
 * references fail fast at load time rather than at request time.
 * @author darthjee
 */
class NamespaceMapBuilder {
  #files;
  #strict;

  /**
   * @param {Array<{namespace: string, resources: object, clients: object, filePath: string}>} files
   * The flat list of files returned by `ConfigIncluder`.
   */
  constructor(files) {
    this.#files = files;
    this.#strict = files.length === 1;
  }

  /**
   * Builds a namespace map from the given list of files.
   * @param {Array<{namespace: string, resources: object, clients: object, filePath: string}>} files
   * The flat list of files returned by `ConfigIncluder`.
   * @returns {Record<string, Namespace>} A map of namespace name to Namespace instance.
   */
  static build(files) {
    return new NamespaceMapBuilder(files).build();
  }

  /**
   * Groups files by namespace, builds one Namespace per group, and eagerly
   * validates every cross-reference before returning.
   * @returns {Record<string, Namespace>} A map of namespace name to Namespace instance.
   * @throws {DuplicateNamespaceItem} When two files sharing a namespace declare the
   * same resource or client name.
   * @throws {NamespaceNotFound|ResourceNotFound|ClientNotFound} When a resource/client
   * reference cannot be resolved.
   */
  build() {
    const namespaces = this.#buildNamespaces();
    this.#validateReferences(namespaces);
    return namespaces;
  }

  /**
   * Groups every file's parsed resources/clients by namespace name, raising on
   * duplicate names within a namespace group, then builds one Namespace per group.
   * @returns {Record<string, Namespace>} A map of namespace name to Namespace instance.
   * @private
   */
  #buildNamespaces() {
    const groups = {};

    this.#files.forEach((file) => {
      const parsed = ConfigParser.fromObject(
        this.#fileConfig(file),
        { namespace: file.namespace, strict: this.#strict },
      );

      const group = groups[file.namespace] ??= { resources: {}, clients: {} };
      this.#mergeInto(group.resources, parsed.resources, file.namespace, 'resource');
      this.#mergeInto(group.clients, parsed.clients, file.namespace, 'client');
    });

    return Object.fromEntries(
      Object.entries(groups).map(([name, { resources, clients }]) => {
        return [name, new Namespace({ name, resources, clients })];
      })
    );
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
   * Merges a file's parsed items into the namespace group's accumulator, raising
   * when an item name is already present.
   * @param {object} target The namespace group's accumulator map.
   * @param {object} source The current file's parsed items.
   * @param {string} namespace The namespace name being merged into.
   * @param {string} itemType Either 'resource' or 'client' (used for the error message).
   * @returns {void}
   * @throws {DuplicateNamespaceItem} When an item name is already present in the group.
   * @private
   */
  #mergeInto(target, source, namespace, itemType) {
    Object.entries(source).forEach(([name, item]) => {
      if (name in target) {
        throw new DuplicateNamespaceItem(name, { namespace, itemType });
      }
      target[name] = item;
    });
  }

  /**
   * Walks every resource in every namespace and validates that its declared client
   * reference, action targets, and paginated_action targets all resolve via the
   * namespace map, raising immediately on the first unresolvable reference.
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
