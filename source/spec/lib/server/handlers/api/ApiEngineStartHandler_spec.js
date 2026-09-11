import { JobRegistry } from 'deku-swarm';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { Namespace } from '../../../../../lib/registry/namespace/Namespace.js';
import { NamespaceMap } from '../../../../../lib/registry/namespace/NamespaceMap.js';
import { ApiEngineStartHandler } from '../../../../../lib/server/handlers/api/ApiEngineStartHandler.js';
import { SecuredRequestHandler } from '../../../../../lib/server/SecuredRequestHandler.js';
import { Application } from '../../../../../lib/services/application/Application.js';
import { ResourceFactory } from '../../../../support/factories/ResourceFactory.js';
import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';

describe('ApiEngineStartHandler', () => {
  let res;

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
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(false);
        spyOn(Application, 'isRunning').and.returnValue(true);
      });

      it('responds with 400 when an entry has no namespace', async () => {
        const req = { body: { targets: [{ resources: ['x'] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when an entry has a non-string namespace', async () => {
        const req = { body: { targets: [{ namespace: 42 }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when resources is not an array of strings', async () => {
        const req = { body: { targets: [{ namespace: 'reports', resources: 'oops' }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when targets is not an array', async () => {
        const req = { body: { targets: { namespace: 'reports' } } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when target-level parameters is not a plain object (an array)', async () => {
        const req = { body: { targets: [{ namespace: 'reports', parameters: [1, 2] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when target-level parameters is not a plain object (a string)', async () => {
        const req = { body: { targets: [{ namespace: 'reports', parameters: 'oops' }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when a resource object entry has no name', async () => {
        const req = { body: { targets: [{ namespace: 'reports', resources: [{ parameters: { id: 1 } }] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when a resource object entry has a blank name', async () => {
        const req = { body: { targets: [{ namespace: 'reports', resources: [{ name: '   ' }] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when a resource object entry has a non-plain-object parameters', async () => {
        const req = { body: { targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: 'oops' }] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when a resource entry parameter value is an object', async () => {
        const req = { body: { targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: { nested: 1 } } }] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when a resource entry parameter value is an array', async () => {
        const req = { body: { targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: [1] } }] }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('responds with 400 when a target-level parameter value is an object', async () => {
        const req = { body: { targets: [{ namespace: 'reports', parameters: { id: { nested: 1 } } }] } };
        await new ApiEngineStartHandler(req, res, 'token').process();
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('when the engine is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
        spyOn(Application, 'isRunning').and.returnValue(false);
      });

      describe('and targets is omitted', () => {
        beforeEach(() => {
          spyOn(Application, 'start').and.returnValue(Promise.resolve({ enqueued: ['home_page'], skippedResources: [] }));
        });

        it('calls Application.start() with the top-level resources unvalidated (still a bare-string-only fallback)', async () => {
          const req = { body: { resources: ['home_page'] } };
          await new ApiEngineStartHandler(req, res, 'token').process();
          expect(Application.start).toHaveBeenCalledWith(['home_page']);
        });

        it('responds with running status and the enqueue result', async () => {
          const req = { body: { resources: ['home_page'] } };
          await new ApiEngineStartHandler(req, res, 'token').process();
          expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['home_page'], skippedResources: [] });
        });
      });

      describe('and targets is given', () => {
        let homePageRequest;
        let categoryRequest;

        beforeEach(() => {
          homePageRequest = ResourceRequestFactory.build({ url: '/' });
          const homePageResource = ResourceFactory.build({ name: 'home_page', resourceRequests: [homePageRequest] });
          categoryRequest = ResourceRequestFactory.build({ url: '/categories.json' });
          const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });

          NamespaceMap.build({
            default: new Namespace({ name: 'default', resources: { home_page: homePageResource } }),
            reports: new Namespace({ name: 'reports', resources: { categories: categoriesResource } }),
          });

          spyOn(Application, 'start').and.returnValue(Promise.resolve(undefined));
        });

        it('transitions the engine without enqueueing the default set', async () => {
          const req = { body: { targets: [{ namespace: 'reports', resources: ['categories'] }] } };
          await new ApiEngineStartHandler(req, res, 'token').process();
          expect(Application.start).toHaveBeenCalledWith([], { enqueue: false });
        });

        it('aggregates the enqueue result across every named target, enqueueing all param-free resources when resources is omitted', async () => {
          const req = {
            body: {
              targets: [
                { namespace: 'reports', resources: ['categories'] },
                { namespace: 'default' },
              ],
            },
          };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['categories'], skippedResources: [] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: categoryRequest, parameters: {} });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest: homePageRequest, parameters: {} });
        });

        it('reports skipped resources from a named target', async () => {
          const req = { body: { targets: [{ namespace: 'reports', resources: ['missing'] }] } };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(res.json).toHaveBeenCalledWith({
            status: 'running',
            enqueued: [],
            skippedResources: [{ name: 'missing', reason: 'not_found' }],
          });
        });
      });
    });

    describe('when the engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(false);
        spyOn(Application, 'isRunning').and.returnValue(true);
      });

      describe('and targets is omitted', () => {
        beforeEach(() => {
          spyOn(Application, 'enqueueResources').and.returnValue({ enqueued: ['home_page'], skippedResources: [] });
        });

        it('calls Application.enqueueResources() with the top-level resources', async () => {
          const req = { body: { resources: ['home_page'] } };
          await new ApiEngineStartHandler(req, res, 'token').process();
          expect(Application.enqueueResources).toHaveBeenCalledWith(['home_page']);
        });

        it('responds with running status and the enqueue result', async () => {
          const req = { body: { resources: ['home_page'] } };
          await new ApiEngineStartHandler(req, res, 'token').process();
          expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['home_page'], skippedResources: [] });
        });
      });

      describe('and targets is given', () => {
        beforeEach(() => {
          const categoryRequest = ResourceRequestFactory.build({ url: '/categories.json' });
          const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });

          NamespaceMap.build({
            default: new Namespace({ name: 'default' }),
            reports: new Namespace({ name: 'reports', resources: { categories: categoriesResource } }),
          });
        });

        it('enqueues named resources scoped to their namespace', async () => {
          const req = { body: { targets: [{ namespace: 'reports', resources: ['categories'] }] } };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['categories'], skippedResources: [] });
        });

        it('does not call Application.start() or Application.enqueueResources()', async () => {
          spyOn(Application, 'start');
          spyOn(Application, 'enqueueResources');
          const req = { body: { targets: [{ namespace: 'reports', resources: ['categories'] }] } };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(Application.start).not.toHaveBeenCalled();
          expect(Application.enqueueResources).not.toHaveBeenCalled();
        });
      });

      describe('and targets carries parameters', () => {
        let categoryRequest;

        beforeEach(() => {
          categoryRequest = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
          const categoriesResource = ResourceFactory.build({ name: 'categories', resourceRequests: [categoryRequest] });

          NamespaceMap.build({
            default: new Namespace({ name: 'default' }),
            reports: new Namespace({ name: 'reports', resources: { categories: categoriesResource } }),
          });
        });

        it('forwards an object-form resources[] entry parameters, merged shape, to ResourceEnqueuer', async () => {
          const req = {
            body: {
              targets: [{ namespace: 'reports', resources: [{ name: 'categories', parameters: { id: 1 } }] }],
            },
          };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 1 } },
          );
          expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['categories'], skippedResources: [] });
        });

        it('forwards a target-level parameters default merged under a per-resource override', async () => {
          const req = {
            body: {
              targets: [{
                namespace: 'reports',
                parameters: { id: 1, extra: 'value' },
                resources: [{ name: 'categories', parameters: { id: 2 } }],
              }],
            },
          };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 2, extra: 'value' } },
          );
        });

        it('applies a target-level parameters default to a bare-string resources[] entry', async () => {
          const req = {
            body: {
              targets: [{ namespace: 'reports', parameters: { id: 5 }, resources: ['categories'] }],
            },
          };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(JobRegistry.enqueue).toHaveBeenCalledWith(
            'ResourceRequestJob',
            { resourceRequest: categoryRequest, parameters: { id: 5 } },
          );
        });

        it('ignores unknown keys on a resource object entry rather than rejecting it', async () => {
          const req = {
            body: {
              targets: [{
                namespace: 'reports',
                resources: [{ name: 'categories', parameters: { id: 1 }, unknown: 'ignored' }],
              }],
            },
          };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(res.status).not.toHaveBeenCalled();
          expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['categories'], skippedResources: [] });
        });

        it('remains unaffected for a plain bare-string-only resources[] request with no parameters anywhere', async () => {
          const req = { body: { targets: [{ namespace: 'reports', resources: ['categories'] }] } };

          await new ApiEngineStartHandler(req, res, 'token').process();

          expect(res.json).toHaveBeenCalledWith({
            status: 'running',
            enqueued: [],
            skippedResources: [{ name: 'categories', reason: 'needs_params' }],
          });
        });
      });
    });

    describe('when the engine is neither stopped nor running', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(false);
        spyOn(Application, 'isRunning').and.returnValue(false);
      });

      it('throws a ConflictError', async () => {
        const req = { body: {} };
        await expectAsync(new ApiEngineStartHandler(req, res, 'token').process())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });
    });
  });
});
