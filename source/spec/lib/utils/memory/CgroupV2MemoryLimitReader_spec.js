import fs from 'node:fs';
import { CgroupV2MemoryLimitReader } from '../../../../lib/utils/memory/CgroupV2MemoryLimitReader.js';

describe('CgroupV2MemoryLimitReader', () => {
  let reader;

  beforeEach(() => {
    reader = new CgroupV2MemoryLimitReader();
  });

  describe('#read', () => {
    it('returns the limit when the file is present', () => {
      spyOn(fs, 'readFileSync').and.returnValue('536870912\n');

      expect(reader.read()).toEqual(536870912);
      expect(fs.readFileSync).toHaveBeenCalledWith('/sys/fs/cgroup/memory.max', 'utf8');
    });

    it('returns null when the file is missing/unreadable', () => {
      spyOn(fs, 'readFileSync').and.throwError('ENOENT');

      expect(reader.read()).toBeNull();
    });

    it('returns null when the file content is the literal "max"', () => {
      spyOn(fs, 'readFileSync').and.returnValue('max\n');

      expect(reader.read()).toBeNull();
    });
  });
});
