import axios from 'axios';
import { JobFactory, JobRegistry } from 'deku-swarm';
import { ActionProcessingJob } from '../../../lib/jobs/ActionProcessingJob.js';
import { EmitJob } from '../../../lib/jobs/EmitJob.js';
import { ExtractionJob } from '../../../lib/jobs/ExtractionJob.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ResourceRequest } from '../../../lib/models/request/resource_request/ResourceRequest.js';
import { NamespaceMapFactory } from '../../support/factories/NamespaceMapFactory.js';
import { AxiosUtils } from '../../support/utils/AxiosUtils.js';
import { EndToEndFlowUtils } from '../../support/utils/EndToEndFlowUtils.js';

const { enqueued, hasEnqueued, performAll, expectEmitted } = EndToEndFlowUtils;

const postIdBody = '<html><body class="page page-id-42 postid-880433 logged-in"></body></html>';

const postIdRequestAttributes = (emitAttributes = {}) => ({
  url: '/bundle/tidal-aberrations/?logged-in',
  parser: { type: 'regex', match: 'postid-(\\d+)', field: 'post_id' },
  emit: { client: 'majora_api', method: 'POST', url: '/api/bundles/resolve', ...emitAttributes },
});

/**
 * End-to-end coverage for the two worked examples from
 * docs/agents/specs/crawler/flows.md: it drives a real ResourceRequestJob → real
 * ExtractionJob/parser → real EmitEnqueuer → real EmitJob chain through the real
 * JobFactory/JobRegistry, mocking only the outermost HTTP boundary (the initial
 * resource fetch and the final emit POST).
 */
describe('ExtractionJob → EmitEnqueuer → EmitJob (end-to-end)', () => {
  let logContext;
  let clients;

  const ctx = EndToEndFlowUtils.setup();

  beforeEach(() => {
    logContext = ctx.logContext;
    clients = NamespaceMapFactory.build({ clients: EndToEndFlowUtils.exampleClients() });

    const parserRegistry = EndToEndFlowUtils.buildParserRegistry();
    JobFactory.build('Action', { klass: ActionProcessingJob });
    JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry, jobRegistry: JobRegistry } });
    JobFactory.build('Emit', { klass: EmitJob, attributes: { clients } });
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
