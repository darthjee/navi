import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineStartHandler } from '../../../../../lib/server/handlers/engine/EngineStartHandler.js';
import { Application } from '../../../../../lib/services/Application.js';

describe("describe('EngineStartHandler'", () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'start').and.returnValue(Promise.resolve({ enqueued: [], skippedResources: [] }));
    spyOn(Application, 'enqueueResources').and.returnValue({ enqueued: [], skippedResources: [] });
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineStartHandler({}, res)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when engine is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
        spyOn(Application, 'isRunning').and.returnValue(false);
      });

      it('calls Application.start() with no resources when the body is empty', async () => {
        await new EngineStartHandler({}, res).handle();
        expect(Application.start).toHaveBeenCalledWith([]);
      });

      it('calls Application.start() with the named resources', async () => {
        await new EngineStartHandler({ body: { resources: ['home_page'] } }, res).handle();
        expect(Application.start).toHaveBeenCalledWith(['home_page']);
      });

      it('responds with running status and the enqueue result', async () => {
        Application.start.and.returnValue(Promise.resolve({ enqueued: ['home_page'], skippedResources: [] }));
        await new EngineStartHandler({ body: { resources: ['home_page'] } }, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'running', enqueued: ['home_page'], skippedResources: [] });
      });

      it('does not call Application.enqueueResources() directly', async () => {
        await new EngineStartHandler({}, res).handle();
        expect(Application.enqueueResources).not.toHaveBeenCalled();
      });
    });

    describe('when engine is running', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(false);
        spyOn(Application, 'isRunning').and.returnValue(true);
      });

      it('calls Application.enqueueResources() with the named resources', async () => {
        await new EngineStartHandler({ body: { resources: ['home_page'] } }, res).handle();
        expect(Application.enqueueResources).toHaveBeenCalledWith(['home_page']);
      });

      it('responds with running status and the enqueue result', async () => {
        Application.enqueueResources.and.returnValue({ enqueued: ['home_page'], skippedResources: [{ name: 'products', reason: 'needs_params' }] });
        await new EngineStartHandler({ body: { resources: ['home_page', 'products'] } }, res).handle();
        expect(res.json).toHaveBeenCalledWith({
          status: 'running',
          enqueued: ['home_page'],
          skippedResources: [{ name: 'products', reason: 'needs_params' }],
        });
      });

      it('does not call Application.start()', async () => {
        await new EngineStartHandler({}, res).handle();
        expect(Application.start).not.toHaveBeenCalled();
      });

      it('does not throw', async () => {
        await expectAsync(new EngineStartHandler({}, res).handle()).toBeResolved();
      });
    });

    describe('when engine is neither stopped nor running', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(false);
        spyOn(Application, 'isRunning').and.returnValue(false);
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineStartHandler({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });

      it('does not call Application.start() or Application.enqueueResources()', async () => {
        await expectAsync(new EngineStartHandler({}, res).handle()).toBeRejected();
        expect(Application.start).not.toHaveBeenCalled();
        expect(Application.enqueueResources).not.toHaveBeenCalled();
      });
    });
  });
});
