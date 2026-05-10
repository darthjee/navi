import { RequestHandlerExecutor } from '../../../../../lib/common/server/RequestHandlerExecutor.js';
import { ConflictError } from '../../../../../lib/exceptions/http/ConflictError.js';
import { EngineStartHandlerExecutor } from '../../../../../lib/server/handlers/engine/EngineStartHandlerExecutor.js';
import { Application } from '../../../../../lib/services/Application.js';

describe('EngineStartHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    spyOn(Application, 'start').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    Application.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new EngineStartHandlerExecutor({}, res)).toBeInstanceOf(RequestHandlerExecutor);
  });

  describe('#handle', () => {
    describe('when engine is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('stopped');
      });

      it('calls Application.start()', async () => {
        await new EngineStartHandlerExecutor({}, res).handle();
        expect(Application.start).toHaveBeenCalled();
      });

      it('responds with running status', async () => {
        await new EngineStartHandlerExecutor({}, res).handle();
        expect(res.json).toHaveBeenCalledWith({ status: 'running' });
      });
    });

    describe('when engine is not stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'status').and.returnValue('running');
      });

      it('throws a ConflictError', async () => {
        await expectAsync(new EngineStartHandlerExecutor({}, res).handle())
          .toBeRejectedWith(jasmine.any(ConflictError));
      });

      it('does not call Application.start()', async () => {
        await expectAsync(new EngineStartHandlerExecutor({}, res).handle()).toBeRejected();
        expect(Application.start).not.toHaveBeenCalled();
      });
    });
  });
});
