import fs from 'node:fs';
import { CgroupV1MemoryLimitReader } from '../../../../lib/utils/memory/CgroupV1MemoryLimitReader.js';

describe('CgroupV1MemoryLimitReader', () => {
  let reader;

  beforeEach(() => {
    reader = new CgroupV1MemoryLimitReader();
  });

  describe('#read', () => {
    it('returns the limit when the file is present', () => {
      spyOn(fs, 'readFileSync').and.returnValue('268435456\n');

      expect(reader.read()).toEqual(268435456);
      expect(fs.readFileSync).toHaveBeenCalledWith('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8');
    });

    it('returns null when the file is missing/unreadable', () => {
      spyOn(fs, 'readFileSync').and.throwError('ENOENT');

      expect(reader.read()).toBeNull();
    });

    it('returns null when the value is the kernel unbounded sentinel', () => {
      spyOn(fs, 'readFileSync').and.returnValue('9223372036854771712\n');

      expect(reader.read()).toBeNull();
    });
  });
});
