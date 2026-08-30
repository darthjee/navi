import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { InvalidEmitRetries } from '../../../../lib/exceptions/config/InvalidEmitRetries.js';

describe('InvalidEmitRetries', () => {
  let error;

  beforeEach(() => {
    error = new InvalidEmitRetries(-1);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidEmitRetries');
  });

  it('has a message naming the invalid value', () => {
    expect(error.message).toBe('Invalid emit retries: -1. Expected a non-negative number');
  });

  it('exposes the retries value', () => {
    expect(error.retries).toEqual(-1);
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
