import { ClientFactory } from './ClientFactory.js';
import { NamespaceMapFactory } from './NamespaceMapFactory.js';
import { AssetDownloadJob } from '../../../lib/jobs/AssetDownloadJob.js';

/**
 * Factory for creating AssetDownloadJob instances in tests.
 */
class AssetDownloadJobFactory {
  /**
   * Builds an AssetDownloadJob instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.id='asset-job'] - The job ID.
   * @param {string} [params.url='https://cdn.example.com/app.css'] - The asset URL.
   * @param {number} [params.status=200] - The expected HTTP status.
   * @param {string} [params.client] - Optional client name. Defaults to `undefined`.
   * @param {NamespaceMap} [params.clientRegistry] - The client registry. Defaults to a NamespaceMap
   * holding a `default` client with base URL `https://example.com`.
   * @returns {AssetDownloadJob} A new AssetDownloadJob instance.
   */
  static build({
    id = 'asset-job',
    url = 'https://cdn.example.com/app.css',
    status = 200,
    client,
    clientRegistry = NamespaceMapFactory.build({
      clients: { default: ClientFactory.build({ baseUrl: 'https://example.com' }) },
    }),
  } = {}) {
    return new AssetDownloadJob({ id, url, status, client, clientRegistry });
  }
}

export { AssetDownloadJobFactory };
