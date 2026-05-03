import { EngineEvents } from '../../../../lib/services/EngineEvents.js';
import { LogBuffer } from '../../../../lib/utils/logging/LogBuffer.js';
import { LogBufferCollection } from '../../../../lib/utils/logging/LogBufferCollection.js';

describe('LogBufferCollection', () => {
  let collection;
  let sourceBuffer;

  beforeEach(() => {
    collection = new LogBufferCollection();
    sourceBuffer = new LogBuffer();
  });

  afterEach(() => {
    EngineEvents.reset();
  });

  describe('#push', () => {
    it('creates a buffer for the key on first push', () => {
      const log = sourceBuffer.add('info', 'message');
      collection.push('job-1', log);
      expect(collection.getLogs('job-1').length).toBe(1);
    });

    it('appends to an existing buffer for the same key', () => {
      const log1 = sourceBuffer.add('info', 'first');
      const log2 = sourceBuffer.add('info', 'second');
      collection.push('job-1', log1);
      collection.push('job-1', log2);
      expect(collection.getLogs('job-1').length).toBe(2);
    });

    it('stores different logs under different keys', () => {
      const log1 = sourceBuffer.add('info', 'first');
      const log2 = sourceBuffer.add('info', 'second');
      collection.push('job-1', log1);
      collection.push('job-2', log2);
      expect(collection.getLogs('job-1').length).toBe(1);
      expect(collection.getLogs('job-2').length).toBe(1);
    });

    it('respects the retention limit per buffer', () => {
      const smallCollection = new LogBufferCollection(2);
      const log1 = sourceBuffer.add('info', 'first');
      const log2 = sourceBuffer.add('info', 'second');
      const log3 = sourceBuffer.add('info', 'third');
      smallCollection.push('job-1', log1);
      smallCollection.push('job-1', log2);
      smallCollection.push('job-1', log3);
      expect(smallCollection.getLogs('job-1').length).toBe(2);
    });
  });

  describe('#getLogs', () => {
    it('returns an empty array for an unknown key', () => {
      expect(collection.getLogs('unknown')).toEqual([]);
    });

    it('returns the same log instance that was pushed', () => {
      const log = sourceBuffer.add('info', 'message');
      collection.push('job-1', log);
      expect(collection.getLogs('job-1')[0]).toBe(log);
    });

    it('returns logs in chronological order (oldest first)', () => {
      const log1 = sourceBuffer.add('info', 'first');
      const log2 = sourceBuffer.add('info', 'second');
      collection.push('job-1', log1);
      collection.push('job-1', log2);
      const logs = collection.getLogs('job-1');
      expect(logs[0]).toBe(log1);
      expect(logs[1]).toBe(log2);
    });
  });

  describe('#clear', () => {
    it('removes all buffers so getLogs returns empty', () => {
      const log = sourceBuffer.add('info', 'message');
      collection.push('job-1', log);
      collection.clear();
      expect(collection.getLogs('job-1')).toEqual([]);
    });

    it('clears buffers for all keys', () => {
      collection.push('job-1', sourceBuffer.add('info', 'a'));
      collection.push('job-2', sourceBuffer.add('info', 'b'));
      collection.clear();
      expect(collection.getLogs('job-1')).toEqual([]);
      expect(collection.getLogs('job-2')).toEqual([]);
    });
  });

  describe('stop event integration', () => {
    it('clears all buffers when the stop event fires', () => {
      const log = sourceBuffer.add('info', 'message');
      collection.push('job-1', log);
      EngineEvents.emit('stop');
      expect(collection.getLogs('job-1')).toEqual([]);
    });
  });
});
