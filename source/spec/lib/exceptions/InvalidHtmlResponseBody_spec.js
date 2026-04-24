import { AppError } from '../../../lib/exceptions/AppError.js';
import { InvalidHtmlResponseBody } from '../../../lib/exceptions/InvalidHtmlResponseBody.js';

describe('InvalidHtmlResponseBody', () => {
  const raw = '<not valid html';
  const cause = new SyntaxError('Unexpected end of input');

  let error;

  beforeEach(() => {
    error = new InvalidHtmlResponseBody(raw, cause);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidHtmlResponseBody');
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

  it('is an instance of AppError', () => {
    expect(error instanceof AppError).toBeTrue();
  });

  it('is an instance of Error', () => {
    expect(error instanceof Error).toBeTrue();
  });
});
