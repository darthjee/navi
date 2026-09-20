import axios from 'axios';
import { JobFactory, JobRegistry } from 'deku-swarm';
import { ActionProcessingJob } from '../../../lib/jobs/ActionProcessingJob.js';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';
import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { PaginatedActionProcessingJob } from '../../../lib/jobs/PaginatedActionProcessingJob.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ResourceRequest } from '../../../lib/models/request/resource_request/ResourceRequest.js';
import { JsonPathParser } from '../../../lib/parsers/JsonPathParser.js';
import { RegexParser } from '../../../lib/parsers/RegexParser.js';
import { Namespace } from '../../../lib/registry/namespace/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/namespace/NamespaceMap.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { LoggerUtils } from '../../support/utils/LoggerUtils.js';

const enqueued = (klass) => JobRegistry.jobsByStatus('enqueued').filter((job) => job instanceof klass);

const hasEnqueued = (klass) => enqueued(klass).length > 0;

const performAll = async (jobs, logContext) => {
  for (const job of jobs) {
    await job.perform(logContext);
  }
};

const expectEmitted = (url, body) => {
  expect(axios.post).toHaveBeenCalledWith(url, body, jasmine.anything());
};

const postIdBody = '<html><body class="page page-id-42 postid-880433 logged-in"></body></html>';

const postIdRequestAttributes = (emitAttributes = {}) => ({
  url: '/bundle/tidal-aberrations/?logged-in',
  parser: { type: 'regex', match: 'postid-(\\d+)', field: 'post_id' },
  emit: { client: 'majora_api', method: 'POST', url: '/api/bundles/resolve', ...emitAttributes },
});

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

  const buildTopJob = ({ body, ...requestAttributes }) => {
    const resourceRequest = new ResourceRequest({ status: 200, clientName: 'lootstudios', ...requestAttributes });

    AxiosUtils.stubGet(200, body);
    AxiosUtils.stubPost(200, {});

    return new ResourceRequestJob({ id: 'top', resourceRequest, parameters: {}, clients });
  };

  const performTopAndFindExtraction = async (topJob) => {
    await topJob.perform(logContext);

    const [extractionJob] = enqueued(ExtractionJob);
    expect(extractionJob).toBeInstanceOf(ExtractionJob);
    return extractionJob;
  };

  const performExtractionAndFindEmits = async (extractionJob) => {
    await extractionJob.perform(logContext);

    return enqueued(EmitJob);
  };

  describe('Loot Studios example (json_path parser + filter + fields + chaining)', () => {
    const rawBody = JSON.stringify({
      bundleObjs: [
        { obj_type: 'miniature', obj_inid: 'in1', obj_title: 'Miniature One', obj_post_id: '1001', bnd_title: 'Bundle Alpha' },
        { obj_type: 'book', obj_inid: 'in2', obj_title: 'Book Two', obj_post_id: '1002', bnd_title: 'Bundle Beta' },
        { obj_type: 'miniature', obj_inid: 'in3', obj_title: 'Miniature Three', obj_post_id: '1003', bnd_title: 'Bundle Gamma' },
      ],
    });

    let job;

    beforeEach(() => {
      job = buildTopJob({
        body: rawBody,
        url: '/wp-admin/admin-ajax.php?action=GetMyLootsCache',
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
    });

    it('still enqueues the ActionProcessingJob chain (regression)', async () => {
      await job.perform(logContext);

      expect(enqueued(ActionProcessingJob)[0]).toBeInstanceOf(ActionProcessingJob);
    });

    it('emits one POST to /api/miniatures per filtered item, with the mapped body', async () => {
      const extractionJob = await performTopAndFindExtraction(job);
      const emitJobs = await performExtractionAndFindEmits(extractionJob);
      expect(emitJobs.length).toBe(2);

      await performAll(emitJobs, logContext);

      expect(axios.post).toHaveBeenCalledTimes(2);
      expectEmitted(
        'https://majora.example.com/api/miniatures',
        { inid: 'in1', name: 'Miniature One', post_id: '1001', bundle: 'Bundle Alpha' },
      );
      expectEmitted(
        'https://majora.example.com/api/miniatures',
        { inid: 'in3', name: 'Miniature Three', post_id: '1003', bundle: 'Bundle Gamma' },
      );
    });
  });

  describe('Regex standalone example (Loot Studios Approach B)', () => {
    let job;

    beforeEach(() => {
      job = buildTopJob({ body: postIdBody, ...postIdRequestAttributes() });
    });

    it('extracts and emits with no ActionProcessingJob enqueued', async () => {
      const extractionJob = await performTopAndFindExtraction(job);
      expect(hasEnqueued(ActionProcessingJob)).toBeFalse();

      const emitJobs = await performExtractionAndFindEmits(extractionJob);
      expect(emitJobs.length).toBe(1);

      await emitJobs[0].perform(logContext);

      expect(axios.post).toHaveBeenCalledOnceWith(
        'https://majora.example.com/api/bundles/resolve',
        { post_id: '880433' },
        jasmine.anything(),
      );
    });
  });

  describe('Disabled emit (parser present, emit.disabled: true)', () => {
    let job;

    beforeEach(() => {
      job = buildTopJob({ body: postIdBody, ...postIdRequestAttributes({ disabled: true }) });
    });

    it('still extracts but never enqueues an EmitJob nor calls the emit HTTP boundary', async () => {
      const extractionJob = await performTopAndFindExtraction(job);
      const emitJobs = await performExtractionAndFindEmits(extractionJob);

      expect(extractionJob.lastError).toBeUndefined();
      expect(logContext.debug).toHaveBeenCalledWith(
        jasmine.stringMatching(/extracted 1 item\(s\)/),
        { items: [{ post_id: '880433' }] },
      );

      expect(emitJobs.length).toBe(0);
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('Only-actions resource (no parser)', () => {
    let job;

    beforeEach(() => {
      job = buildTopJob({
        body: JSON.stringify({ obj_inid: 'in1' }),
        url: '/categories.json',
        actions: [
          { resource: 'miniature_detail', parameters: { bundle_inid: 'parsedBody.obj_inid' } },
        ],
      });
    });

    it('enqueues the ActionProcessingJob chain and no ExtractionJob/EmitJob at all', async () => {
      await job.perform(logContext);

      expect(hasEnqueued(ExtractionJob)).toBeFalse();
      expect(hasEnqueued(EmitJob)).toBeFalse();
      expect(hasEnqueued(ActionProcessingJob)).toBeTrue();
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

  const buildNamespaceMap = ({ targetRequest }) => NamespaceMap.build({
    default: new Namespace({
      name: 'default',
      resources: {
        product: ResourceFactory.build({ name: 'product', resourceRequests: [targetRequest], namespace: 'default' }),
      },
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

  const buildRequest = (attributes) => new ResourceRequest({
    status: 200, clientName: 'lootstudios', namespace: 'default', ...attributes,
  });

  const buildOriginJob = (resourceRequest) => new ResourceRequestJob({
    id: 'origin', resourceRequest, parameters: {}, clients: namespaceMap,
  });

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
