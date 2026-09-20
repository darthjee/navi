import { JobRegistry } from 'deku-swarm';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { NamespaceMap } from '../../../../../lib/registry/namespace/NamespaceMap.js';
import { ApiEngineStartHandler } from '../../../../../lib/server/handlers/api/ApiEngineStartHandler.js';
import { SecuredRequestHandler } from '../../../../../lib/server/SecuredRequestHandler.js';
import { Application } from '../../../../../lib/services/application/Application.js';
import { ApplicationStateUtils } from '../../../../support/utils/ApplicationStateUtils.js';
import { NamespaceMapUtils } from '../../../../support/utils/NamespaceMapUtils.js';

describe('ApiEngineStartHandler', () => {
  let res;

  const processBody = (body) => new ApiEngineStartHandler({ body }, res, 'token').process();

  const expectRunningResponse = (enqueued, skippedResources = []) => {
    expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued, skippedResources });
  };

  beforeEach(() => {
    res = { json: jasmine.createSpy('json'), status: jasmine.createSpy('status').and.returnValue({ json: jasmine.createSpy('json') }) };
    spyOn(JobRegistry, 'enqueue').and.stub();
  });

  afterEach(() => {
    Application.reset();
    NamespaceMap.reset();
  });

  it('is an instance of SecuredRequestHandler', () => {
    expect(new ApiEngineStartHandler({ body: {} }, res, 'token')).toBeInstanceOf(SecuredRequestHandler);
  });

  describe('#process', () => {
    describe('when targets is present but malformed', () => {
      const malformedTargets = [
        ['an entry has no namespace', { targets: [{ resources: ['x'] }] }],
        ['an entry has a non-string namespace', { targets: [{ namespace: 42 }] }],
        ['resources is not an array of strings', { targets: [{ namespace: 'reports', resources: 'oops' }] }],
        ['targets is not an array', { targets: { namespace: 'reports' } }],
        ['target-level parameters is not a plain object (an array)', { targets: [{ namespace: 'reports', parameters: [1, 2] }] }],
        ['target-level parameters is not a plain object (a string)', { targets: [{ namespace: 'reports', parameters: 'oops' }] }],
        ['a resource object entry has no name', { targets: [{ namespace: 'reports', resources: [{ parameters: { id: 1 } }] }] }],
        ['a resource object entry has a blank name', { targets: [{ namespace: 'reports', resources: [{ name: '   ' }] }] }],
        [
          'a resource object entry has a non-plain-object parameters',
          { targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: 'oops' }] }] },
        ],
        [
          'a resource entry parameter value is an object',
          { targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: { nested: 1 } } }] }] },
        ],
        [
          'a resource entry parameter value is an array',
          { targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: [1] } }] }] },
        ],
        [
          'a target-level parameter value is an object',
          { targets: [{ namespace: 'reports', parameters: { id: { nested: 1 } } }] },
        ],
      ];

      beforeEach(() => {
        ApplicationStateUtils.stubRunning();
      });

      malformedTargets.forEach(([description, body]) => {
        it(`responds with 400 when ${description}`, async () => {
          await processBody(body);
          expect(res.status).toHaveBeenCalledWith(400);
        });
      });
    });

    describe('when the engine is stopped', () => {
      beforeEach(() => {
        ApplicationStateUtils.stubStopped();
      });

      describe('and targets is omitted', () => {
        beforeEach(() => {
          spyOn(Application, 'start').and.returnValue(Promise.resolve({ enqueued: ['home_page'], skippedResources: [] }));
        });

        it('calls Application.start() with the top-level resources unvalidated (still a bare-string-only fallback)', async () => {
          await processBody({ resources: ['home_page'] });
          expect(Application.start).toHaveBeenCalledWith(['home_page']);
        });

        it('responds with running status and the enqueue result', async () => {
          await processBody({ resources: ['home_page'] });
          expectRunningResponse(['home_page']);
        });
      });

      describe('and targets is given', () => {
        let homePageRequest;
        let categoryRequest;

        beforeEach(() => {
          ({ home_page: homePageRequest, categories: categoryRequest } = NamespaceMapUtils.build({
            default: { home_page: '/' },
            reports: { categories: '/categories.json' },
          }));

          spyOn(Application, 'start').and.returnValue(Promise.resolve(undefined));
        });

        it('transitions the engine without enqueueing the default set', async () => {
          await processBody({ targets: [{ namespace: 'reports', resources: ['categories'] }] });
          expect(Application.start).toHaveBeenCalledWith([], { enqueue: false });
        });

        it('aggregates the enqueue result across every named target, enqueueing all param-free resources when resources is omitted', async () => {
          await processBody({
            targets: [
              { namespace: 'reports', resources: ['categories'] },
              { namespace: 'default' },
            ],
          });

          expectRunningResponse(['categories']);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: categoryRequest, parameters: {} });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
        });

        it('reports skipped resources from a named target', async () => {
          await processBody({ targets: [{ namespace: 'reports', resources: ['missing'] }] });

          expectRunningResponse([], [{ name: 'missing', reason: 'not_found' }]);
        });
      });

      describe('and targets carries an object-form resource with parameters', () => {
        let collectionRequest;

        beforeEach(() => {
          ({ collection: collectionRequest } = NamespaceMapUtils.build({
            reports: { collection: '/bundle/{:slug}/' },
          }));

          spyOn(Application, 'start').and.returnValue(Promise.resolve(undefined));
        });

        it('enqueues the resource with the given parameters and responds with running status', async () => {
          await processBody({
            targets: [{ namespace: 'reports', resources: [{ name: 'collection', parameters: { slug: 'x' } }] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: collectionRequest, parameters: { slug: 'x' } },
          );
          expectRunningResponse(['collection']);
        });
      });
    });

    describe('when the engine is running', () => {
      beforeEach(() => {
        ApplicationStateUtils.stubRunning();
      });

      describe('and targets is omitted', () => {
        beforeEach(() => {
          spyOn(Application, 'enqueueResources').and.returnValue({ enqueued: ['home_page'], skippedResources: [] });
        });

        it('calls Application.enqueueResources() with the top-level resources', async () => {
          await processBody({ resources: ['home_page'] });
          expect(Application.enqueueResources).toHaveBeenCalledWith(['home_page']);
        });

        it('responds with running status and the enqueue result', async () => {
          await processBody({ resources: ['home_page'] });
          expectRunningResponse(['home_page']);
        });
      });

      describe('and targets is given', () => {
        beforeEach(() => {
          NamespaceMapUtils.build({ reports: { categories: '/categories.json' } });
        });

        it('enqueues named resources scoped to their namespace', async () => {
          await processBody({ targets: [{ namespace: 'reports', resources: ['categories'] }] });

          expectRunningResponse(['categories']);
        });

        it('does not call Application.start() or Application.enqueueResources()', async () => {
          spyOn(Application, 'start');
          spyOn(Application, 'enqueueResources');
          await processBody({ targets: [{ namespace: 'reports', resources: ['categories'] }] });

          expect(Application.start).not.toHaveBeenCalled();
          expect(Application.enqueueResources).not.toHaveBeenCalled();
        });
      });

      describe('and targets carries parameters', () => {
        let categoryRequest;

        beforeEach(() => {
          ({ categories: categoryRequest } = NamespaceMapUtils.build({
            reports: { categories: '/categories/{:id}.json' },
          }));
        });

        it('forwards an object-form resources[] entry parameters, merged shape, to ResourceEnqueuer', async () => {
          await processBody({
            targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: 1 } }] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 1 } },
          );
          expectRunningResponse(['categories']);
        });

        it('forwards a target-level parameters default merged under a per-resource override', async () => {
          await processBody({
            targets: [{
              namespace: 'reports',
              parameters: { id: 1, extra: 'value' },
              resources: [{ name: 'categories', parameters: { id: 2 } }],
            }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 2, extra: 'value' } },
          );
        });

        it('applies a target-level parameters default to a bare-string resources[] entry', async () => {
          await processBody({
            targets: [{ namespace: 'reports', parameters: { id: 5 }, resources: ['categories'] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 5 } },
          );
        });

        it('ignores unknown keys on a resource object entry rather than rejecting it', async () => {
          await processBody({
            targets: [{
              namespace: 'reports',
              resources: [{ name: 'categories', parameters: { id: 1 }, unknown: 'ignored' }],
            }],
          });

          expect(res.status).not.toHaveBeenCalled();
          expectRunningResponse(['categories']);
        });

        it('remains unaffected for a plain bare-string-only resources[] request with no parameters anywhere', async () => {
          await processBody({ targets: [{ namespace: 'reports', resources: ['categories'] }] });

          expectRunningResponse([], [{ name: 'categories', reason: 'needs_params' }]);
        });

        it('enqueues one and skips the other when the same resource name repeats with satisfying and missing parameters', async () => {
          await processBody({
            targets: [{
              namespace: 'reports',
              resources: [
                { name: 'categories', parameters: { id: 1 } },
                { name: 'categories', parameters: { other: 'value' } },
              ],
            }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 1 } },
          );
          expectRunningResponse(
            ['categories'],
            [{ name: 'categories', reason: 'needs_params', parameters: { other: 'value' } }],
          );
        });

        it('threads extra parameter keys through to a request with no {:token} at all', async () => {
          NamespaceMap.reset();
          const { home_page: homePageRequest } = NamespaceMapUtils.build({ reports: { home_page: '/' } });

          await processBody({
            targets: [{ namespace: 'reports', resources: [{ name: 'home_page', parameters: { unrelated: 'value' } }] }],
          });

          expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
            'ResourceRequestJob',
            { resourceRequest: homePageRequest, parameters: { unrelated: 'value' } },
          );
          expectRunningResponse(['home_page']);
        });
      });
    });

    describe('when the engine is neither stopped nor running', () => {
      beforeEach(() => {
        ApplicationStateUtils.stubNeither();
      });

      it('throws a ConflictError', async () => {
        await expectAsync(processBody({}))
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
