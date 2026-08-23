import axios from 'axios';
import { JobFactory, JobRegistry } from 'deku-swarm';
import { ActionProcessingJob } from '../../../lib/jobs/ActionProcessingJob.js';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';
import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ResourceRequest } from '../../../lib/models/request/ResourceRequest.js';
import { JsonPathParser } from '../../../lib/parsers/JsonPathParser.js';
import { RegexParser } from '../../../lib/parsers/RegexParser.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
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
