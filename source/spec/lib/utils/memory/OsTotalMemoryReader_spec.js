import os from 'node:os';
import { OsTotalMemoryReader } from '../../../../lib/utils/memory/OsTotalMemoryReader.js';

describe('OsTotalMemoryReader', () => {
  describe('#read', () => {
    it('returns the OS total memory', () => {
      spyOn(os, 'totalmem').and.returnValue(17179869184);

      const reader = new OsTotalMemoryReader();

      expect(reader.read()).toEqual(17179869184);
    });
  });
});
