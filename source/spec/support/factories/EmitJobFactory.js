import { NamespaceMapFactory } from './NamespaceMapFactory.js';
import { ResourceRequestEmitFactory } from './ResourceRequestEmitFactory.js';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';

/**
 * Factory for creating EmitJob instances in tests.
 */
class EmitJobFactory {
  /**
   * Builds an EmitJob instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.id='id'] - The job ID.
   * @param {object} [params.item] - The extracted item. Defaults to `{ name: 'item' }`.
   * @param {ResourceRequestEmit} [params.emit] - The emit configuration. Defaults to ResourceRequestEmitFactory.build().
   * @param {object} [params.parameters={}] - The job parameters.
   * @param {NamespaceMap} [params.clients] - The namespace map. Defaults to NamespaceMapFactory.build().
   * @returns {EmitJob} A new EmitJob instance.
   */
  static build({
    id = 'id',
    item = { name: 'item' },
    emit = ResourceRequestEmitFactory.build(),
    parameters = {},
    clients = NamespaceMapFactory.build(),
  } = {}) {
    return new EmitJob({ id, item, emit, parameters, clients });
  }
}

export { EmitJobFactory };
