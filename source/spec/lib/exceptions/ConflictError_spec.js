import { ConflictError } from '../../../lib/exceptions/ConflictError.js';

describe('ConflictError', () => {
  let error;

  beforeEach(() => {
    error = new ConflictError();
  });

  it('has the correct name', () => {
    expect(error.name).toBe('ConflictError');
  });

  it('has the correct message', () => {
    expect(error.message).toBe('Conflict');
  });

  it('is an instance of Error', () => {
    expect(error instanceof Error).toBeTrue();
  });
});
