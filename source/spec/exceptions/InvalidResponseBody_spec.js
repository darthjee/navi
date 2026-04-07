import { InvalidResponseBody } from '../../lib/exceptions/InvalidResponseBody.js';

describe('InvalidResponseBody', () => {
  const raw = 'not valid json';
  const cause = new SyntaxError('Unexpected token');

  let error;

  beforeEach(() => {
    error = new InvalidResponseBody(raw, cause);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidResponseBody');
  });

  it('includes the cause message in its own message', () => {
    expect(error.message).toContain(cause.message);
  });

  it('exposes the raw body', () => {
    expect(error.raw).toBe(raw);
  });

  it('exposes the cause error', () => {
    expect(error.cause).toBe(cause);
  });

  it('is an instance of Error', () => {
    expect(error instanceof Error).toBeTrue();
  });
});
