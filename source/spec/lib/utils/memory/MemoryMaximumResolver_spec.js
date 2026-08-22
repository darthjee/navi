import { MemoryMaximumResolver } from '../../../../lib/utils/memory/MemoryMaximumResolver.js';

describe('MemoryMaximumResolver', () => {
  const dummyReader = (value) => ({ read: () => value });

  describe('#resolve', () => {
    it('returns the first non-null reader result', () => {
      const readers = [dummyReader(null), dummyReader(2048), dummyReader(4096)];
      const resolver = new MemoryMaximumResolver(undefined, { readers });

      expect(resolver.resolve()).toEqual(2048);
    });

    it('resolves via the config tier when it wins', () => {
      const readers = [dummyReader(1024), dummyReader(2048), dummyReader(4096), dummyReader(8192)];
      const resolver = new MemoryMaximumResolver(undefined, { readers });

      expect(resolver.resolve()).toEqual(1024);
    });

    it('resolves via the cgroup v2 tier when config has no limit', () => {
      const readers = [dummyReader(null), dummyReader(2048), dummyReader(4096), dummyReader(8192)];
      const resolver = new MemoryMaximumResolver(undefined, { readers });

      expect(resolver.resolve()).toEqual(2048);
    });

    it('resolves via the cgroup v1 tier when config and cgroup v2 have no limit', () => {
      const readers = [dummyReader(null), dummyReader(null), dummyReader(4096), dummyReader(8192)];
      const resolver = new MemoryMaximumResolver(undefined, { readers });

      expect(resolver.resolve()).toEqual(4096);
    });

    it('falls back to the OS total memory tier when no other tier has a limit', () => {
      const readers = [dummyReader(null), dummyReader(null), dummyReader(null), dummyReader(8192)];
      const resolver = new MemoryMaximumResolver(undefined, { readers });

      expect(resolver.resolve()).toEqual(8192);
    });

    it('returns null when every reader returns null', () => {
      const readers = [dummyReader(null), dummyReader(null)];
      const resolver = new MemoryMaximumResolver(undefined, { readers });

      expect(resolver.resolve()).toBeNull();
    });

    it('uses the default reader chain when none is injected, honouring the configured maximum', () => {
      const resolver = new MemoryMaximumResolver(4096);

      expect(resolver.resolve()).toEqual(4096);
    });

    it('uses the default reader chain falling back to OS total memory when no maximum is configured', () => {
      const resolver = new MemoryMaximumResolver();

      expect(resolver.resolve()).toEqual(jasmine.any(Number));
      expect(resolver.resolve()).toBeGreaterThan(0);
    });
  });

  describe('.resolve', () => {
    it('resolves through a fresh instance using the default reader chain', () => {
      expect(MemoryMaximumResolver.resolve(4096)).toEqual(4096);
    });
  });
});
