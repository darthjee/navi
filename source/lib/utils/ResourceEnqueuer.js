import { JobRegistry } from '../background/JobRegistry.js';
import { NamespaceNotFound } from '../exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../exceptions/registry/ResourceNotFound.js';
import { NamespaceMap } from '../registry/NamespaceMap.js';

const DEFAULT_NAMESPACE = 'default';

/**
 * Resolves resource names against the `default` namespace via `NamespaceMap` and
 * enqueues the ResourceRequestJobs for each, skipping (rather than partially
 * enqueueing) any resource that is unknown or has a request needing parameters.
 * @author darthjee
 */
class ResourceEnqueuer {
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
   * Looks up a resource, by name, in the `default` namespace, returning `null`
   * instead of raising when the resource (or the `default` namespace itself) cannot
   * be found.
   * @param {string} name - The resource name to look up.
   * @returns {Resource|null} The resolved resource, or null if not found.
   * @private
   */
  #findResource(name) {
    try {
      return NamespaceMap.getResource(DEFAULT_NAMESPACE, name);
    } catch (error) {
      if (error instanceof ResourceNotFound || error instanceof NamespaceNotFound) return null;
      throw error;
    }
  }
}

export { ResourceEnqueuer };
