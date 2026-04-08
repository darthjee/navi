import { NullResponse } from '../../../lib/exceptions/NullResponse.js';

describe('NullResponse', () => {
  let error;

  beforeEach(() => {
    error = new NullResponse();
  });

  it('has the correct name', () => {
    expect(error.name).toBe('NullResponse');
  });

  it('has a message mentioning null', () => {
    expect(error.message).toContain('null');
  });

  it('is an instance of Error', () => {
    expect(error instanceof Error).toBeTrue();
  });
});
