import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { MemoryStatusHandler } from '../../../../../lib/server/handlers/memory/MemoryStatusHandler.js';

describe('MemoryStatusHandler', () => {
  let res;
  let memoryConfig;
  let rssReader;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    memoryConfig = {
      maximum:   1000,
      statusFor: jasmine.createSpy('statusFor').and.returnValue('medium'),
    };
    rssReader = { read: jasmine.createSpy('read').and.returnValue(500) };
  });

  it('is an instance of RequestHandler', () => {
    expect(new MemoryStatusHandler({}, res, memoryConfig, rssReader)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    it('responds with current, maximum, percentage, and status', () => {
      new MemoryStatusHandler({}, res, memoryConfig, rssReader).handle();

      expect(res.json).toHaveBeenCalledWith({
        current:    500,
        maximum:    1000,
        percentage: 50,
        status:     'medium',
      });
    });

    it('derives status from the computed percentage via memoryConfig', () => {
      new MemoryStatusHandler({}, res, memoryConfig, rssReader).handle();

      expect(memoryConfig.statusFor).toHaveBeenCalledWith(50);
    });

    it('reads the current RSS via the injected rssReader', () => {
      new MemoryStatusHandler({}, res, memoryConfig, rssReader).handle();

      expect(rssReader.read).toHaveBeenCalled();
    });

    describe('when current exceeds maximum', () => {
      beforeEach(() => {
        rssReader = { read: jasmine.createSpy('read').and.returnValue(1500) };
        memoryConfig.statusFor.and.returnValue('over');
      });

      it('still responds with a status, rather than erroring', () => {
        new MemoryStatusHandler({}, res, memoryConfig, rssReader).handle();

        expect(res.json).toHaveBeenCalledWith({
          current:    1500,
          maximum:    1000,
          percentage: 150,
          status:     'over',
        });
      });
    });

    describe('with a default rssReader', () => {
      it('uses a ProcessRssReader to obtain the current RSS', () => {
        new MemoryStatusHandler({}, res, memoryConfig).handle();

        const result = res.json.calls.mostRecent().args[0];
        expect(typeof result.current).toEqual('number');
      });
    });
  });
});
