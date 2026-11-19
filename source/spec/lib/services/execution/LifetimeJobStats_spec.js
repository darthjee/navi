import { LifetimeJobStats } from '../../../../lib/services/execution/LifetimeJobStats.js';

describe('LifetimeJobStats', () => {
  const buildStats = (overrides = {}) => ({
    total: 10, dead: 4, failed: 0, retryQueue: 0,
    pruned: { finished: 0, dead: 0 },
    ...overrides,
  });

  describe('.fromStats', () => {
    it('adds pruned counts into total and dead', () => {
      const stats = LifetimeJobStats.fromStats(buildStats({
        total: 10, dead: 4, failed: 2, retryQueue: 3, pruned: { finished: 5, dead: 6 },
      }));

      expect(stats.total).toEqual(21);
      expect(stats.dead).toEqual(10);
      expect(stats.unresolved).toEqual(5);
    });

    it('returns resident values when nothing was pruned', () => {
      const stats = LifetimeJobStats.fromStats(buildStats());

      expect(stats.total).toEqual(10);
      expect(stats.dead).toEqual(4);
    });

    it('returns zeros for all-zero stats', () => {
      const stats = LifetimeJobStats.fromStats(buildStats({ total: 0, dead: 0 }));

      expect([stats.total, stats.dead, stats.unresolved]).toEqual([0, 0, 0]);
    });

    it('does not add unresolved into total', () => {
      const stats = LifetimeJobStats.fromStats(buildStats({ failed: 2, retryQueue: 3 }));

      expect(stats.total).toEqual(10);
    });
  });

  describe('#percentage', () => {
    it('returns dead over total as a percentage', () => {
      expect(LifetimeJobStats.fromStats(buildStats()).percentage).toEqual(40);
    });

    it('returns 0 when total is 0', () => {
      expect(LifetimeJobStats.fromStats(buildStats({ total: 0, dead: 0 })).percentage).toEqual(0);
    });

    it('uses lifetime counts including pruned', () => {
      const stats = LifetimeJobStats.fromStats(buildStats({
        total: 10, dead: 4, pruned: { finished: 10, dead: 6 },
      }));

      expect(stats.percentage).toEqual(50);
    });

    it('is not affected by unresolved', () => {
      const stats = LifetimeJobStats.fromStats(buildStats({ failed: 5, retryQueue: 5 }));

      expect(stats.percentage).toEqual(40);
    });
  });

  describe('constructor', () => {
    it('exposes the given values as read-only', () => {
      const stats = new LifetimeJobStats({ total: 1, dead: 2, unresolved: 3 });

      try { stats.total = 99; } catch (e) { expect(e).toBeInstanceOf(TypeError); }

      expect([stats.total, stats.dead, stats.unresolved]).toEqual([1, 2, 3]);
    });
  });
});
