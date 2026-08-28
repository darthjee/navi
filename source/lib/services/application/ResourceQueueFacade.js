import { ResourceEnqueuer } from '../../utils/ResourceEnqueuer.js';

/**
 * ResourceQueueFacade owns the resource-enqueuing responsibility on behalf of
 * `ApplicationInstance`, delegating to `ResourceEnqueuer` for the default namespace.
 * @author darthjee
 */
class ResourceQueueFacade {
  /**
   * Enqueues all parameter-free ResourceRequests into the job registry.
   * These are requests whose URLs contain no {:placeholder} tokens and can be
   * processed immediately without any external parameters.
   * Delegates to `ResourceEnqueuer#enqueueAll` (default namespace), so it always
   * reflects the live state of the `NamespaceMap` singleton, including resources
   * added via `POST /api/config` after boot.
   * @returns {void}
   */
  enqueueFirstJobs() {
    new ResourceEnqueuer().enqueueAll();
  }

  /**
   * Enqueues resources by name, or all parameter-free resources when no names are given.
   * Unknown resource names, or resources with any request that needs parameters, are
   * skipped entirely and reported back rather than failing the whole call.
   * @param {Array<string>} [names=[]] - Resource names to enqueue; omit/empty for the default set.
   * @returns {{enqueued: Array<string>, skippedResources: Array<{name: string, reason: string}>}} The enqueued names and any skipped resources.
   */
  enqueueResources(names = []) {
    if (!names.length) {
      this.enqueueFirstJobs();
      return { enqueued: [], skippedResources: [] };
    }

    return new ResourceEnqueuer().enqueue(names);
  }
}

export { ResourceQueueFacade };
