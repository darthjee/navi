import { NotFoundError } from '../../../lib/exceptions/NotFoundError.js';

describe('NotFoundError', () => {
  describe('with default message', () => {
    let error;

    beforeEach(() => {
      error = new NotFoundError();
    });

    it('has the correct name', () => {
      expect(error.name).toBe('NotFoundError');
    });

    it('has the default message', () => {
      expect(error.message).toBe('Not Found');
    });

    it('is an instance of Error', () => {
      expect(error instanceof Error).toBeTrue();
    });
  });

  describe('with a custom message', () => {
    it('uses the provided message', () => {
      const error = new NotFoundError('Job not found');
      expect(error.message).toBe('Job not found');
    });
  });
});
