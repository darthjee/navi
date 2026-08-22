import { ConfigMemoryLimitReader } from '../../../../lib/utils/memory/ConfigMemoryLimitReader.js';

describe('ConfigMemoryLimitReader', () => {
  describe('#read', () => {
    it('returns the configured maximum', () => {
      const reader = new ConfigMemoryLimitReader(1024);
      expect(reader.read()).toEqual(1024);
    });

    it('returns null when no maximum was configured', () => {
      const reader = new ConfigMemoryLimitReader();
      expect(reader.read()).toBeNull();
    });
  });
});
