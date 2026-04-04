import { LogFactory } from '../../lib/utils/LogFactory.js';
import { IncrementalIdGenerator } from '../../lib/utils/IncrementalIdGenerator.js';
import { Log } from '../../lib/utils/Log.js';

describe('LogFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new LogFactory();
  });

  describe('#build', () => {
    it('returns a Log instance', () => {
      expect(factory.build('info', 'message')).toBeInstanceOf(Log);
    });

    it('assigns the given level', () => {
      expect(factory.build('warn', 'msg').level).toBe('warn');
    });

    it('assigns the given message', () => {
      expect(factory.build('info', 'hello').message).toBe('hello');
    });

    it('assigns an incremental id starting at 1', () => {
      const log = factory.build('info', 'first');
      expect(log.id).toBe(1);
    });

    it('increments the id on each call', () => {
      const first = factory.build('info', 'first');
      const second = factory.build('info', 'second');
      expect(second.id).toBe(first.id + 1);
    });
  });

  describe('with a custom idGenerator', () => {
    it('uses the provided idGenerator', () => {
      const idGenerator = new IncrementalIdGenerator(42);
      factory = new LogFactory({ idGenerator });
      expect(factory.build('info', 'msg').id).toBe(42);
    });
  });
});
