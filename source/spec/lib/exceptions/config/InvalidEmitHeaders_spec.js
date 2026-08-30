import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { InvalidEmitHeaders } from '../../../../lib/exceptions/config/InvalidEmitHeaders.js';

describe('InvalidEmitHeaders', () => {
  let error;

  beforeEach(() => {
    error = new InvalidEmitHeaders(['a', 'b']);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidEmitHeaders');
  });

  it('has a message naming the invalid value', () => {
    expect(error.message).toBe('Invalid emit headers: ["a","b"]. Expected a map of string values');
  });

  it('exposes the headers value', () => {
    expect(error.headers).toEqual(['a', 'b']);
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
