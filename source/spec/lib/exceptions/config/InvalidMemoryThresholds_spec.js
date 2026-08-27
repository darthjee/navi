import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { InvalidMemoryThresholds } from '../../../../lib/exceptions/config/InvalidMemoryThresholds.js';

describe('InvalidMemoryThresholds', () => {
  let error;
  const thresholds = { low: 60.0, medium: 50.0, high: 75.0, over: 100.0 };

  beforeEach(() => {
    error = new InvalidMemoryThresholds('low', 'medium', thresholds);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidMemoryThresholds');
  });

  it('has a message naming the two out-of-order keys and their values', () => {
    expect(error.message).toBe('Invalid memory thresholds: "low" (60) must be strictly less than "medium" (50)');
  });

  it('exposes the lowerKey', () => {
    expect(error.lowerKey).toEqual('low');
  });

  it('exposes the higherKey', () => {
    expect(error.higherKey).toEqual('medium');
  });

  it('exposes the full thresholds object', () => {
    expect(error.thresholds).toEqual(thresholds);
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
