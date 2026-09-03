import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { InvalidMemoryDataStore } from '../../../../lib/exceptions/config/InvalidMemoryDataStore.js';

describe('InvalidMemoryDataStore', () => {
  let error;

  beforeEach(() => {
    error = new InvalidMemoryDataStore(-5);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidMemoryDataStore');
  });

  it('has a message naming the offending interval value', () => {
    expect(error.message).toBe('Invalid memory data_store interval: -5. Expected a finite number greater than 0');
  });

  it('exposes the interval', () => {
    expect(error.interval).toEqual(-5);
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
