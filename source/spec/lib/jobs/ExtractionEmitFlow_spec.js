import axios from 'axios';
import { JobFactory, JobRegistry } from 'deku-swarm';
import { ActionProcessingJob } from '../../../lib/jobs/ActionProcessingJob.js';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';
import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { PaginatedActionProcessingJob } from '../../../lib/jobs/PaginatedActionProcessingJob.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ResourceRequest } from '../../../lib/models/request/ResourceRequest.js';
import { JsonPathParser } from '../../../lib/parsers/JsonPathParser.js';
import { RegexParser } from '../../../lib/parsers/RegexParser.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

/**
 * End-to-end coverage for the two worked examples from
 * docs/agents/future/crawler/flows.md: it drives a real ResourceRequestJob → real
 * ExtractionJob/parser → real EmitEnqueuer → real EmitJob chain through the real
 * JobFactory/JobRegistry, mocking only the outermost HTTP boundary (the initial
 * resource fetch and the final emit POST).
 */
describe('ExtractionJob → EmitEnqueuer → EmitJob (end-to-end)', () => {
  let logContext;
  let clients;

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);

    JobRegistry.build({ cooldown: -1 });

    clients = NamespaceMapFactory.build({
      clients: {
        lootstudios: ClientFactory.build({ name: 'lootstudios', baseUrl: 'https://app.lootstudios.com' }),
        majora_api: ClientFactory.build({ name: 'majora_api', baseUrl: 'https://majora.example.com' }),
      },
    });

    const parserRegistry = new ParserRegistry({ json_path: new JsonPathParser(), regex: new RegexParser() });
    JobFactory.build('Action', { klass: ActionProcessingJob });
    JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry, jobRegistry: JobRegistry } });
    JobFactory.build('Emit', { klass: EmitJob, attributes: { clients } });
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
  });

  describe('Loot Studios example (json_path parser + filter + fields + chaining)', () => {
    const rawBody = JSON.stringify({
      bundleObjs: [
        { obj_type: 'miniature', obj_inid: 'in1', obj_title: 'Miniature One', obj_post_id: '1001', bnd_title: 'Bundle Alpha' },
        { obj_type: 'book', obj_inid: 'in2', obj_title: 'Book Two', obj_post_id: '1002', bnd_title: 'Bundle Beta' },
        { obj_type: 'miniature', obj_inid: 'in3', obj_title: 'Miniature Three', obj_post_id: '1003', bnd_title: 'Bundle Gamma' },
      ],
    });

    let resourceRequest;
    let job;

    beforeEach(() => {
      resourceRequest = new ResourceRequest({
        url: '/wp-admin/admin-ajax.php?action=GetMyLootsCache',
        status: 200,
        clientName: 'lootstudios',
        parser: {
          type: 'json_path',
          match: 'bundleObjs',
          filter: [{ field: 'obj_type', equals: 'miniature' }],
          fields: { obj_inid: 'inid', obj_title: 'name', obj_post_id: 'post_id', bnd_title: 'bundle' },
        },
        emit: {
          client: 'majora_api',
          method: 'POST',
          url: '/api/miniatures',
        },
        actions: [
          { resource: 'miniature_detail', parameters: { bundle_inid: 'parsedBody.obj_inid' } },
        ],
      });

      job = new ResourceRequestJob({ id: 'top', resourceRequest, parameters: {}, clients });

      AxiosUtils.stubGet(200, rawBody);
      AxiosUtils.stubPost(200, {});
    });

    it('still enqueues the ActionProcessingJob chain (regression)', async () => {
      await job.perform(logContext);

      const actionJob = JobRegistry.jobsByStatus('enqueued').find((enqueued) => enqueued instanceof ActionProcessingJob);
      expect(actionJob).toBeInstanceOf(ActionProcessingJob);
    });

    it('emits one POST to /api/miniatures per filtered item, with the mapped body', async () => {
      await job.perform(logContext);

      const extractionJob = JobRegistry.jobsByStatus('enqueued').find((enqueued) => enqueued instanceof ExtractionJob);
      expect(extractionJob).toBeInstanceOf(ExtractionJob);

      await extractionJob.perform(logContext);

      const emitJobs = JobRegistry.jobsByStatus('enqueued').filter((enqueued) => enqueued instanceof EmitJob);
      expect(emitJobs.length).toBe(2);

      for (const emitJob of emitJobs) {
        await emitJob.perform(logContext);
      }

      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.post).toHaveBeenCalledWith(
        'https://majora.example.com/api/miniatures',
        { inid: 'in1', name: 'Miniature One', post_id: '1001', bundle: 'Bundle Alpha' },
        jasmine.anything(),
      );
      expect(axios.post).toHaveBeenCalledWith(
        'https://majora.example.com/api/miniatures',
        { inid: 'in3', name: 'Miniature Three', post_id: '1003', bundle: 'Bundle Gamma' },
        jasmine.anything(),
      );
    });
  });

  describe('Regex standalone example (Loot Studios Approach B)', () => {
    const rawBody = '<html><body class="page page-id-42 postid-880433 logged-in"></body></html>';

    let resourceRequest;
    let job;

    beforeEach(() => {
      resourceRequest = new ResourceRequest({
        url: '/bundle/tidal-aberrations/?logged-in',
        status: 200,
        clientName: 'lootstudios',
        parser: {
          type: 'regex',
          match: 'postid-(\\d+)',
          field: 'post_id',
        },
        emit: {
          client: 'majora_api',
          method: 'POST',
          url: '/api/bundles/resolve',
        },
      });

      job = new ResourceRequestJob({ id: 'top', resourceRequest, parameters: {}, clients });

      AxiosUtils.stubGet(200, rawBody);
      AxiosUtils.stubPost(200, {});
    });

    it('extracts and emits with no ActionProcessingJob enqueued', async () => {
      await job.perform(logContext);

      const enqueued = JobRegistry.jobsByStatus('enqueued');
      expect(enqueued.some((job_) => job_ instanceof ActionProcessingJob)).toBeFalse();

      const extractionJob = enqueued.find((job_) => job_ instanceof ExtractionJob);
      expect(extractionJob).toBeInstanceOf(ExtractionJob);

      await extractionJob.perform(logContext);

      const emitJobs = JobRegistry.jobsByStatus('enqueued').filter((job_) => job_ instanceof EmitJob);
      expect(emitJobs.length).toBe(1);

      await emitJobs[0].perform(logContext);

      expect(axios.post).toHaveBeenCalledOnceWith(
        'https://majora.example.com/api/bundles/resolve',
        { post_id: '880433' },
        jasmine.anything(),
      );
    });
  });

  describe('Only-actions resource (no parser)', () => {
    let resourceRequest;
    let job;

    beforeEach(() => {
      resourceRequest = new ResourceRequest({
        url: '/categories.json',
        status: 200,
        clientName: 'lootstudios',
        actions: [
          { resource: 'miniature_detail', parameters: { bundle_inid: 'parsedBody.obj_inid' } },
        ],
      });

      job = new ResourceRequestJob({ id: 'top', resourceRequest, parameters: {}, clients });

      AxiosUtils.stubGet(200, JSON.stringify({ obj_inid: 'in1' }));
      AxiosUtils.stubPost(200, {});
    });

    it('enqueues the ActionProcessingJob chain and no ExtractionJob/EmitJob at all', async () => {
      await job.perform(logContext);

      const enqueued = JobRegistry.jobsByStatus('enqueued');
      expect(enqueued.some((job_) => job_ instanceof ExtractionJob)).toBeFalse();
      expect(enqueued.some((job_) => job_ instanceof EmitJob)).toBeFalse();
      expect(enqueued.some((job_) => job_ instanceof ActionProcessingJob)).toBeTrue();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});

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
  let parserRegistry;

  const buildNamespaceMap = ({ resources }) => NamespaceMap.build({
    default: new Namespace({
      name: 'default',
      resources,
      clients: {
        lootstudios: ClientFactory.build({ name: 'lootstudios', baseUrl: 'https://app.lootstudios.com' }),
        majora_api: ClientFactory.build({ name: 'majora_api', baseUrl: 'https://majora.example.com' }),
      },
    }),
  });

  const registerJobFactories = () => {
    JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: namespaceMap } });
    JobFactory.build('PaginatedAction', { klass: PaginatedActionProcessingJob });
    JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry, jobRegistry: JobRegistry } });
    JobFactory.build('Emit', { klass: EmitJob, attributes: { clients: namespaceMap } });
  };

  const enqueued = (klass) => JobRegistry.jobsByStatus('enqueued').filter((job) => job instanceof klass);

  beforeEach(() => {
    LoggerUtils.stubLoggerMethods();
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);

    JobRegistry.build({ cooldown: -1 });
    parserRegistry = new ParserRegistry({ json_path: new JsonPathParser(), regex: new RegexParser() });

    AxiosUtils.stubPost(200, {});
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
    NamespaceMap.reset();
  });

  describe('Scenario A — the paginated target resource carries parser + emit', () => {
    let originJob;

    beforeEach(() => {
      const targetRequest = new ResourceRequest({
        url: '/products/{:page}.json',
        status: 200,
        clientName: 'lootstudios',
        namespace: 'default',
        parser: { type: 'json_path', match: 'items', fields: { sku: 'sku', name: 'name' } },
        emit: { client: 'majora_api', method: 'POST', url: '/api/products/{:page}' },
      });

      namespaceMap = buildNamespaceMap({
        resources: {
          product: ResourceFactory.build({ name: 'product', resourceRequests: [targetRequest], namespace: 'default' }),
        },
      });
      registerJobFactories();

      const originRequest = new ResourceRequest({
        url: '/index.json',
        status: 200,
        clientName: 'lootstudios',
        namespace: 'default',
        paginated_actions: [
          { resource: 'product', pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }] },
        ],
      });
      originJob = new ResourceRequestJob({ id: 'origin', resourceRequest: originRequest, parameters: {}, clients: namespaceMap });

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

      for (const job of perPageJobs) {
        await job.perform(logContext);
      }

      const extractionJobs = enqueued(ExtractionJob);
      expect(extractionJobs.length).toBe(3);

      for (const job of extractionJobs) {
        await job.perform(logContext);
      }

      const emitJobs = enqueued(EmitJob);
      expect(emitJobs.length).toBe(6);

      for (const job of emitJobs) {
        await job.perform(logContext);
      }

      expect(axios.post).toHaveBeenCalledTimes(6);
      for (const page of [1, 2, 3]) {
        expect(axios.post).toHaveBeenCalledWith(
          `https://majora.example.com/api/products/${page}`,
          { sku: `P${page}-A`, name: `Product ${page} A` },
          jasmine.anything(),
        );
        expect(axios.post).toHaveBeenCalledWith(
          `https://majora.example.com/api/products/${page}`,
          { sku: `P${page}-B`, name: `Product ${page} B` },
          jasmine.anything(),
        );
      }
    });
  });

  describe('Scenario B — the origin resource carries parser + emit alongside paginated_actions', () => {
    let originJob;

    beforeEach(() => {
      const targetRequest = new ResourceRequest({
        url: '/products/{:page}.json',
        status: 200,
        clientName: 'lootstudios',
        namespace: 'default',
      });

      namespaceMap = buildNamespaceMap({
        resources: {
          product: ResourceFactory.build({ name: 'product', resourceRequests: [targetRequest], namespace: 'default' }),
        },
      });
      registerJobFactories();

      const originRequest = new ResourceRequest({
        url: '/catalog.json',
        status: 200,
        clientName: 'lootstudios',
        namespace: 'default',
        parser: { type: 'json_path', match: 'products', fields: { id: 'id', title: 'title' } },
        emit: { client: 'majora_api', method: 'POST', url: '/api/catalog' },
        paginated_actions: [
          { resource: 'product', pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }] },
        ],
      });
      originJob = new ResourceRequestJob({ id: 'origin', resourceRequest: originRequest, parameters: {}, clients: namespaceMap });

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

      for (const job of originEmitJobs) {
        await job.perform(logContext);
      }

      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.post).toHaveBeenCalledWith(
        'https://majora.example.com/api/catalog', { id: 'c1', title: 'Cat One' }, jasmine.anything(),
      );
      expect(axios.post).toHaveBeenCalledWith(
        'https://majora.example.com/api/catalog', { id: 'c2', title: 'Cat Two' }, jasmine.anything(),
      );

      const extractionCountBefore = enqueued(ExtractionJob).length;
      const emitCountBefore = enqueued(EmitJob).length;

      const [paginatedJob] = enqueued(PaginatedActionProcessingJob);
      await paginatedJob.perform(logContext);

      const perPageJobs = enqueued(ResourceRequestJob);
      expect(perPageJobs.map((job) => job.arguments.url).sort()).toEqual(['/products/1.json', '/products/2.json']);

      for (const job of perPageJobs) {
        await job.perform(logContext);
      }

      // the paginated target has no parser: it produces no further ExtractionJob/EmitJob
      expect(enqueued(ExtractionJob).length).toBe(extractionCountBefore);
      expect(enqueued(EmitJob).length).toBe(emitCountBefore);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });
});
