import { ResourceRequestCollector } from './ResourceRequestCollector.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { NamespaceNotFound } from '../exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../exceptions/registry/ResourceNotFound.js';
import { NamespaceMap } from '../registry/NamespaceMap.js';

const DEFAULT_NAMESPACE = 'default';

/**
 * Resolves resource names against a given namespace (`default` unless otherwise
 * specified) via `NamespaceMap` and enqueues the ResourceRequestJobs for each,
 * skipping (rather than partially enqueueing) any resource that is unknown, disabled,
 * or has a request needing parameters.
 * @author darthjee
 */
class ResourceEnqueuer {
  #namespace;

  /**
   * @param {string} [namespace='default'] - The namespace to resolve resources against.
   */
  constructor(namespace = DEFAULT_NAMESPACE) {
    this.#namespace = namespace;
  }

  /**
   * Enqueues the given resource names.
   * @param {Array<string>} names - Resource names to enqueue.
   * @returns {{enqueued: Array<string>, skippedResources: Array<{name: string, reason: string}>}} The enqueued names and any skipped resources.
   */
  enqueue(names) {
    const enqueued = [];
    const skippedResources = [];

    names.forEach((name) => {
      const resource = this.#findResource(name);

      if (!resource) {
        skippedResources.push({ name, reason: 'not_found' });
        return;
      }

      if (resource.resourceRequests.some((request) => request.disabled)) {
        skippedResources.push({ name, reason: 'disabled' });
        return;
      }

      if (resource.resourceRequests.some((request) => request.needsParams())) {
        skippedResources.push({ name, reason: 'needs_params' });
        return;
      }

      resource.resourceRequests.forEach((resourceRequest) => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
      });
      enqueued.push(name);
    });

    return { enqueued, skippedResources };
  }

  /**
   * Enqueues every parameter-free (and enabled) resource request declared within
   * the target namespace. Mirrors the boot-time `ApplicationInstance#enqueueFirstJobs`
   * strategy, scoped to an arbitrary namespace instead of the boot-time default.
   * @returns {{enqueued: Array<string>, skippedResources: Array<object>}} Always
   * `{ enqueued: [], skippedResources: [] }` — matching the existing bulk-enqueue
   * convention of not tracking individual resource names.
   */
  enqueueAll() {
    const namespace = this.#findNamespace();

    if (namespace) {
      new ResourceRequestCollector(namespace.resourceRegistry).requestsNeedingNoParams().forEach((resourceRequest) => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
      });
    }

    return { enqueued: [], skippedResources: [] };
  }

  /**
   * Looks up a resource, by name, in the target namespace, returning `null`
   * instead of raising when the resource (or the namespace itself) cannot be found.
   * @param {string} name - The resource name to look up.
   * @returns {Resource|null} The resolved resource, or null if not found.
   * @private
   */
  #findResource(name) {
    const namespace = this.#findNamespace();
    if (!namespace) return null;

    try {
      return namespace.resourceRegistry.getItem(name);
    } catch (error) {
      if (error instanceof ResourceNotFound) return null;
      throw error;
    }
  }

  /**
   * Looks up the target namespace, returning `null` instead of raising when it
   * cannot be found.
   * @returns {Namespace|null} The resolved namespace, or null if not found.
   * @private
   */
  #findNamespace() {
    try {
      return NamespaceMap.getNamespace(this.#namespace);
    } catch (error) {
      if (error instanceof NamespaceNotFound) return null;
      throw error;
    }
  }
}

export { ResourceEnqueuer };
