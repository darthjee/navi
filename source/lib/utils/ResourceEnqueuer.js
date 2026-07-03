import { JobRegistry } from '../background/JobRegistry.js';
import { ResourceRegistry } from '../registry/ResourceRegistry.js';

/**
 * Resolves resource names against the ResourceRegistry and enqueues the
 * ResourceRequestJobs for each, skipping (rather than partially enqueueing)
 * any resource that is unknown or has a request needing parameters.
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
      if (!ResourceRegistry.has(name)) {
        skippedResources.push({ name, reason: 'not_found' });
        return;
      }

      const resource = ResourceRegistry.getItem(name);
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
}

export { ResourceEnqueuer };
