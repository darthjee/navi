import axios from 'axios';
import { JobFactory, JobRegistry } from 'deku-swarm';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';
import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { PaginatedActionProcessingJob } from '../../../lib/jobs/PaginatedActionProcessingJob.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ResourceRequest } from '../../../lib/models/request/resource_request/ResourceRequest.js';
import { Namespace } from '../../../lib/registry/namespace/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/namespace/NamespaceMap.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { EndToEndFlowUtils } from '../../support/utils/EndToEndFlowUtils.js';

const { enqueued, performAll, expectEmitted } = EndToEndFlowUtils;

/**
 * End-to-end coverage for the interaction between `paginated_actions` fan-out and the
 * `parser` + `emit` extraction path (issue #705). It drives the real chain
 * ResourceRequestJob → PaginatedActionProcessingJob → per-page ResourceRequestJob →
 * ExtractionJob → EmitJob through the real JobFactory/JobRegistry, resolving resources and
 * clients from the real NamespaceMap singleton, and mocking only the HTTP boundary
 * (`axios.get` for the crawl fetches, `axios.post` for the emit).
 */
describe('paginated_actions + parser/emit interaction (end-to-end)', () => {
  let logContext;
  let namespaceMap;

  const ctx = EndToEndFlowUtils.setup();

  const buildNamespaceMap = ({ targetRequest }) => NamespaceMap.build({
    default: new Namespace({
      name: 'default',
      resources: {
        product: ResourceFactory.build({ name: 'product', resourceRequests: [targetRequest], namespace: 'default' }),
      },
      clients: EndToEndFlowUtils.exampleClients(),
    }),
  });

  const registerJobFactories = () => {
    const parserRegistry = EndToEndFlowUtils.buildParserRegistry();

    JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: namespaceMap } });
    JobFactory.build('PaginatedAction', { klass: PaginatedActionProcessingJob });
    JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry, jobRegistry: JobRegistry } });
    JobFactory.build('Emit', { klass: EmitJob, attributes: { clients: namespaceMap } });
  };

  const buildRequest = (attributes) => new ResourceRequest({
    status: 200, clientName: 'lootstudios', namespace: 'default', ...attributes,
  });

  const buildOriginJob = (resourceRequest) => new ResourceRequestJob({
    id: 'origin', resourceRequest, parameters: {}, clients: namespaceMap,
  });

  beforeEach(() => {
    logContext = ctx.logContext;
    AxiosUtils.stubPost(200, {});
  });

  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('Scenario A — the paginated target resource carries parser + emit', () => {
    let originJob;

    beforeEach(() => {
      const targetRequest = buildRequest({
        url: '/products/{:page}.json',
        parser: { type: 'json_path', match: 'items', fields: { sku: 'sku', name: 'name' } },
        emit: { client: 'majora_api', method: 'POST', url: '/api/products/{:page}' },
      });

      namespaceMap = buildNamespaceMap({ targetRequest });
      registerJobFactories();

      originJob = buildOriginJob(buildRequest({
        url: '/index.json',
        paginated_actions: [
          { resource: 'product', pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }] },
        ],
      }));

      // page-varying stub: the origin fetch drives pagination, each product page returns its own list
      spyOn(axios, 'get').and.callFake((url) => {
        const match = url.match(/\/products\/(\d+)\.json$/);
        if (match) {
          const page = match[1];
          return Promise.resolve({
            status: 200,
            data: JSON.stringify({
              items: [
                { sku: `P${page}-A`, name: `Product ${page} A` },
                { sku: `P${page}-B`, name: `Product ${page} B` },
              ],
            }),
          });
        }
        return Promise.resolve({ status: 200, data: JSON.stringify({ total_pages: 3 }) });
      });
    });

    it('runs an independent ExtractionJob → EmitJob chain per page, with no cross-talk', async () => {
      await originJob.perform(logContext);

      const paginatedJobs = enqueued(PaginatedActionProcessingJob);
      expect(paginatedJobs.length).toBe(1);
      expect(enqueued(ExtractionJob).length).toBe(0);

      await paginatedJobs[0].perform(logContext);

      const perPageJobs = enqueued(ResourceRequestJob);
      expect(perPageJobs.length).toBe(3);
      expect(perPageJobs.map((job) => job.arguments.url).sort()).toEqual([
        '/products/1.json', '/products/2.json', '/products/3.json',
      ]);

      await performAll(perPageJobs, logContext);

      const extractionJobs = enqueued(ExtractionJob);
      expect(extractionJobs.length).toBe(3);

      await performAll(extractionJobs, logContext);

      const emitJobs = enqueued(EmitJob);
      expect(emitJobs.length).toBe(6);

      await performAll(emitJobs, logContext);

      expect(axios.post).toHaveBeenCalledTimes(6);
      for (const page of [1, 2, 3]) {
        const url = `https://majora.example.com/api/products/${page}`;
        expectEmitted(url, { sku: `P${page}-A`, name: `Product ${page} A` });
        expectEmitted(url, { sku: `P${page}-B`, name: `Product ${page} B` });
      }
    });
  });

  describe('Scenario B — the origin resource carries parser + emit alongside paginated_actions', () => {
    let originJob;

    beforeEach(() => {
      namespaceMap = buildNamespaceMap({ targetRequest: buildRequest({ url: '/products/{:page}.json' }) });
      registerJobFactories();

      originJob = buildOriginJob(buildRequest({
        url: '/catalog.json',
        parser: { type: 'json_path', match: 'products', fields: { id: 'id', title: 'title' } },
        emit: { client: 'majora_api', method: 'POST', url: '/api/catalog' },
        paginated_actions: [
          { resource: 'product', pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }] },
        ],
      }));

      spyOn(axios, 'get').and.callFake((url) => {
        if (url.includes('/products/')) return Promise.resolve({ status: 200, data: '{}' });
        return Promise.resolve({
          status: 200,
          data: JSON.stringify({
            total_pages: 2,
            products: [{ id: 'c1', title: 'Cat One' }, { id: 'c2', title: 'Cat Two' }],
          }),
        });
      });
    });

    it('emits the origin extraction exactly once while the pagination fan-out still happens', async () => {
      await originJob.perform(logContext);

      expect(enqueued(ExtractionJob).length).toBe(1);
      expect(enqueued(PaginatedActionProcessingJob).length).toBe(1);

      const [originExtraction] = enqueued(ExtractionJob);
      await originExtraction.perform(logContext);

      const originEmitJobs = enqueued(EmitJob);
      expect(originEmitJobs.length).toBe(2);

      await performAll(originEmitJobs, logContext);

      expect(axios.post).toHaveBeenCalledTimes(2);
      expectEmitted('https://majora.example.com/api/catalog', { id: 'c1', title: 'Cat One' });
      expectEmitted('https://majora.example.com/api/catalog', { id: 'c2', title: 'Cat Two' });

      const extractionCountBefore = enqueued(ExtractionJob).length;
      const emitCountBefore = enqueued(EmitJob).length;

      const [paginatedJob] = enqueued(PaginatedActionProcessingJob);
      await paginatedJob.perform(logContext);

      const perPageJobs = enqueued(ResourceRequestJob);
      expect(perPageJobs.map((job) => job.arguments.url).sort()).toEqual(['/products/1.json', '/products/2.json']);

      await performAll(perPageJobs, logContext);

      // the paginated target has no parser: it produces no further ExtractionJob/EmitJob
      expect(enqueued(ExtractionJob).length).toBe(extractionCountBefore);
      expect(enqueued(EmitJob).length).toBe(emitCountBefore);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });
});
