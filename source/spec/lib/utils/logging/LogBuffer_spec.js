import { LogBuffer } from '../../../../lib/utils/logging/LogBuffer.js';

describe('LogBuffer', () => {
  let buffer;

  beforeEach(() => {
    buffer = new LogBuffer();
  });

  describe('constructor', () => {
    it('starts with an empty buffer', () => {
      expect(buffer.size).toBe(0);
    });

    it('defaults retention to 100', () => {
      expect(buffer.retention).toBe(100);
    });

    it('accepts a custom retention', () => {
      const customBuffer = new LogBuffer(50);
      expect(customBuffer.retention).toBe(50);
    });
  });

  describe('#add', () => {
    it('adds a log to the buffer', () => {
      buffer.add('info', 'message');
      expect(buffer.size).toBe(1);
    });

    it('returns the created log', () => {
      const log = buffer.add('info', 'message');
      expect(log.level).toBe('info');
      expect(log.message).toBe('message');
    });

    it('assigns incremental IDs starting at 1', () => {
      const first = buffer.add('info', 'first');
      const second = buffer.add('info', 'second');
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it('assigns empty attributes by default', () => {
      const log = buffer.add('info', 'msg');
      expect(log.attributes).toEqual({});
    });

    it('assigns the given attributes', () => {
      const attrs = { jobId: 3 };
      const log = buffer.add('info', 'msg', attrs);
      expect(log.attributes).toEqual(attrs);
    });

    describe('when retention limit is reached', () => {
      let smallBuffer;

      beforeEach(() => {
        smallBuffer = new LogBuffer(3);
        smallBuffer.add('info', 'first');
        smallBuffer.add('info', 'second');
        smallBuffer.add('info', 'third');
      });

      it('does not exceed the retention limit', () => {
        smallBuffer.add('info', 'fourth');
        expect(smallBuffer.size).toBe(3);
      });

      it('removes the oldest log', () => {
        smallBuffer.add('info', 'fourth');
        const logs = smallBuffer.getLogs();
        expect(logs[0].message).toBe('second');
      });

      it('keeps the newest logs', () => {
        smallBuffer.add('info', 'fourth');
        const logs = smallBuffer.getLogs();
        expect(logs[logs.length - 1].message).toBe('fourth');
      });
    });
  });

  describe('#getLogs', () => {
    it('returns an empty array when buffer is empty', () => {
      expect(buffer.getLogs()).toEqual([]);
    });

    it('returns all logs', () => {
      buffer.add('info', 'first');
      buffer.add('warn', 'second');
      expect(buffer.getLogs().length).toBe(2);
    });

    it('returns a copy of the logs array', () => {
      buffer.add('info', 'first');
      const logs = buffer.getLogs();
      logs.push('extra');
      expect(buffer.size).toBe(1);
    });
  });

  describe('#getLogById', () => {
    it('returns the log with the matching ID', () => {
      const added = buffer.add('info', 'message');
      const found = buffer.getLogById(added.id);
      expect(found).toBe(added);
    });

    it('returns undefined when no log has the given ID', () => {
      expect(buffer.getLogById(999)).toBeUndefined();
    });
  });

  describe('#getLogsByLevel', () => {
    beforeEach(() => {
      buffer.add('info', 'info message');
      buffer.add('error', 'error message');
      buffer.add('info', 'another info');
    });

    it('returns only logs matching the given level', () => {
      const infoLogs = buffer.getLogsByLevel('info');
      expect(infoLogs.length).toBe(2);
      infoLogs.forEach(log => expect(log.level).toBe('info'));
    });

    it('returns an empty array when no logs match the level', () => {
      expect(buffer.getLogsByLevel('debug')).toEqual([]);
    });
  });

  describe('#clear', () => {
    it('removes all logs from the buffer', () => {
      buffer.add('info', 'first');
      buffer.add('info', 'second');
      buffer.clear();
      expect(buffer.size).toBe(0);
    });

    it('results in an empty getLogs', () => {
      buffer.add('info', 'first');
      buffer.clear();
      expect(buffer.getLogs()).toEqual([]);
    });
  });

  describe('#size', () => {
    it('returns 0 for an empty buffer', () => {
      expect(buffer.size).toBe(0);
    });

    it('returns the number of logs in the buffer', () => {
      buffer.add('info', 'first');
      buffer.add('info', 'second');
      expect(buffer.size).toBe(2);
    });
  });

  describe('#retention', () => {
    it('returns the configured retention limit', () => {
      const customBuffer = new LogBuffer(25);
      expect(customBuffer.retention).toBe(25);
    });
  });

  describe('#toJSON', () => {
    it('returns an empty array when buffer is empty', () => {
      expect(buffer.toJSON()).toEqual([]);
    });

    it('returns an array of plain objects', () => {
      buffer.add('info', 'message');
      const json = buffer.toJSON();
      expect(json.length).toBe(1);
      expect(json[0].id).toBe(1);
      expect(json[0].level).toBe('info');
      expect(json[0].message).toBe('message');
      expect(typeof json[0].timestamp).toBe('string');
    });
  });
});
