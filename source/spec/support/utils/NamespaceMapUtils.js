import { Namespace } from '../../../lib/registry/namespace/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/namespace/NamespaceMap.js';
import { ResourceFactory } from '../factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../factories/ResourceRequestFactory.js';

/**
 * Test utility for building the NamespaceMap fixtures used by handler specs.
 *
 * Cleanup (NamespaceMap.reset()) is left to the calling spec.
 */
class NamespaceMapUtils {
  /**
   * Builds the NamespaceMap from a description of the resources of each namespace.
   *
   * Every resource is built with a single ResourceRequest for the given url. A resource
   * can be described either by its url or by an object `{ url, disabled }`, in which case
   * the request is built disabled when `disabled` is true. The `default` namespace is
   * always registered, empty when not described.
   * @param {Record<string, Record<string, string|{url: string, disabled?: boolean}>>} namespaces -
   * Maps a namespace name to an object mapping resource names to the url (or the
   * `{ url, disabled }` descriptor) of their single request.
   * @returns {Record<string, ResourceRequest>} The built requests, keyed by resource name.
   * @example
   * const requests = NamespaceMapUtils.build({
   *   default: { home_page: '/' },
   *   reports: { categories: '/categories.json' },
   * });
   * requests.categories; // the ResourceRequest for '/categories.json'
   * @example
   * NamespaceMapUtils.build({ default: { old_page: { url: '/old', disabled: true } } });
   */
  static build({ default: defaultResources = {}, ...others } = {}) {
    const requests = {};
    const namespaces = {};

    Object.entries({ default: defaultResources, ...others }).forEach(([name, resources]) => {
      namespaces[name] = new Namespace({
        name,
        resources: NamespaceMapUtils.#buildResources(resources, requests),
      });
    });

    NamespaceMap.build(namespaces);

    return requests;
  }

  /**
   * Builds the Resource of each entry, collecting its request.
   * @param {Record<string, string|{url: string, disabled?: boolean}>} resources - Maps resource
   * names to request urls or `{ url, disabled }` descriptors.
   * @param {Record<string, ResourceRequest>} requests - Collector of the built requests.
   * @returns {Record<string, Resource>} The built resources, keyed by name.
   */
  static #buildResources(resources, requests) {
    const built = {};

    Object.entries(resources).forEach(([name, description]) => {
      const { url, disabled } = typeof description === 'string' ? { url: description } : description;

      requests[name] = ResourceRequestFactory.build({ url, disabled });
      built[name] = ResourceFactory.build({ name, resourceRequests: [requests[name]] });
    });

    return built;
  }
}

export { NamespaceMapUtils };
