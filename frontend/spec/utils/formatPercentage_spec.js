import formatPercentage from '../../src/utils/formatPercentage.js';

describe('formatPercentage', () => {
  describe('when the value rounds down', () => {
    it('returns the value rounded to one decimal place', () => {
      expect(formatPercentage(0.11)).toBe('0.1');
    });
  });

  describe('when the value is just below the rounding boundary', () => {
    it('returns the value rounded to one decimal place', () => {
      expect(formatPercentage(0.14)).toBe('0.1');
    });
  });

  describe('when the value is exactly at the rounding boundary', () => {
    it('rounds half-up to one decimal place', () => {
      expect(formatPercentage(0.15)).toBe('0.2');
    });
  });

  describe('when the value rounds up', () => {
    it('returns the value rounded to one decimal place', () => {
      expect(formatPercentage(0.19)).toBe('0.2');
    });
  });

  describe('with a real-world floating point value', () => {
    it('returns the value rounded to one decimal place', () => {
      expect(formatPercentage(16.326141357421875)).toBe('16.3');
    });
  });
});
