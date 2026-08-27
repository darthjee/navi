import { JobRegistry } from 'deku-swarm';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { Namespace } from '../../../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../../../lib/registry/NamespaceMap.js';
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

        it('calls Application.start() with the top-level resources', async () => {
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
