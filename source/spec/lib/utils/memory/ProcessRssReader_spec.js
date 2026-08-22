import { ProcessRssReader } from '../../../../lib/utils/memory/ProcessRssReader.js';

describe('ProcessRssReader', () => {
  describe('#read', () => {
    it('returns the current process RSS', () => {
      spyOn(process, 'memoryUsage').and.returnValue({ rss: 123456789 });

      const reader = new ProcessRssReader();

      expect(reader.read()).toEqual(123456789);
    });
  });
});
