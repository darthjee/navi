import formatTimestamp from '../../src/utils/formatTimestamp.js';

describe('formatTimestamp', () => {
  describe('when given a valid ISO timestamp', () => {
    it('formats it as yyyy-MM-dd HH:mm:ss', () => {
      expect(formatTimestamp('2026-08-30T12:00:00.000Z')).toMatch(/^2026-08-30 \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('when given a null or undefined value', () => {
    it('returns an em dash', () => {
      expect(formatTimestamp(null)).toBe('—');
      expect(formatTimestamp(undefined)).toBe('—');
    });
  });

  describe('when given an unparseable value', () => {
    it('returns the raw input', () => {
      expect(formatTimestamp('not-a-date')).toBe('not-a-date');
    });
  });
});
