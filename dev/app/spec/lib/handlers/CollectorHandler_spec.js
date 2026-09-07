import { RequestHandler } from '../../../lib/common/server/RequestHandler.js';
import { Logger } from '../../../lib/common/utils/logging/Logger.js';
import CollectorHandler from '../../../lib/handlers/CollectorHandler.js';

describe('CollectorHandler', () => {
  let endSpy;
  let res;

  beforeEach(() => {
    spyOn(Logger, 'info');
    endSpy = jasmine.createSpy('end');
    res = { status: jasmine.createSpy('status').and.returnValue({ end: endSpy }) };
  });

  it('is an instance of RequestHandler', () => {
    expect(new CollectorHandler({}, {})).toBeInstanceOf(RequestHandler);
  });

  describe('#handle — with a source and body', () => {
    const req = { params: { source: 'x' }, body: { foo: 'bar' } };

    it('logs the received emission', () => {
      new CollectorHandler(req, res).handle();
      expect(Logger.info).toHaveBeenCalledWith(
        'CollectorHandler: received emission',
        { source: 'x', body: { foo: 'bar' } }
      );
    });

    it('responds with 204', () => {
      new CollectorHandler(req, res).handle();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(endSpy).toHaveBeenCalled();
    });
  });

  describe('#handle — with a missing body', () => {
    const req = { params: { source: 'x' } };

    it('logs an empty body', () => {
      new CollectorHandler(req, res).handle();
      expect(Logger.info).toHaveBeenCalledWith(
        'CollectorHandler: received emission',
        { source: 'x', body: {} }
      );
    });

    it('responds with 204', () => {
      new CollectorHandler(req, res).handle();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(endSpy).toHaveBeenCalled();
    });
  });
});
