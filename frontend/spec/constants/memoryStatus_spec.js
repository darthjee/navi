import { colorForMemoryStatus } from '../../src/constants/memoryStatus.js';

describe('memoryStatus', () => {
  describe('colorForMemoryStatus', () => {
    describe('when status is low', () => {
      it('returns the dark gray class', () => {
        expect(colorForMemoryStatus('low', 10)).toBe('text-memory-low');
      });
    });

    describe('when status is medium', () => {
      it('returns the green class', () => {
        expect(colorForMemoryStatus('medium', 40)).toBe('text-memory-medium');
      });
    });

    describe('when status is high', () => {
      it('returns the yellow class', () => {
        expect(colorForMemoryStatus('high', 60)).toBe('text-memory-high');
      });
    });

    describe('when status is over and percentage is exactly 100', () => {
      it('returns the red class', () => {
        expect(colorForMemoryStatus('over', 100)).toBe('text-memory-over');
      });
    });

    describe('when percentage exceeds 100', () => {
      it('returns the purple override class regardless of status', () => {
        expect(colorForMemoryStatus('over', 100.1)).toBe('text-memory-over-limit');
      });
    });
  });
});
