import formatBytes from '../../src/utils/formatBytes.js';

describe('formatBytes', () => {
  describe('when bytes is 0', () => {
    it('returns 0.0 B', () => {
      expect(formatBytes(0)).toBe('0.0 B');
    });
  });

  describe('when the value stays in the byte tier', () => {
    it('returns the value formatted in B', () => {
      expect(formatBytes(512)).toBe('512.0 B');
    });
  });

  describe('when the value lands in the kilobyte tier', () => {
    it('returns the value formatted in KB', () => {
      expect(formatBytes(2048)).toBe('2.0 KB');
    });
  });

  describe('when the value lands in the megabyte tier', () => {
    it('returns the value formatted in MB', () => {
      expect(formatBytes(89128960)).toBe('85.0 MB');
    });
  });

  describe('when the value lands in the gigabyte tier', () => {
    it('returns the value formatted in GB', () => {
      expect(formatBytes(3221225472)).toBe('3.0 GB');
    });
  });

  describe('when the value is exactly at a unit boundary', () => {
    it('rolls over to the next unit', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
    });
  });
});
