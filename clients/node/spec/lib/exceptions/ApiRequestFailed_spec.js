import { ApiRequestFailed } from '../../../lib/exceptions/ApiRequestFailed.js';

describe('ApiRequestFailed', () => {
  it('sets the message, name and given attributes', () => {
    const error = new ApiRequestFailed('Request to http://example.com failed with status 400', {
      statusCode: 400,
      url: 'http://example.com',
      body: { error: 'bad namespace' },
    });

    expect(error.message).toBe('Request to http://example.com failed with status 400');
    expect(error.name).toBe('ApiRequestFailed');
    expect(error.statusCode).toBe(400);
    expect(error.url).toBe('http://example.com');
    expect(error.body).toEqual({ error: 'bad namespace' });
    expect(error).toBeInstanceOf(Error);
  });

  it('defaults optional attributes to undefined when not given', () => {
    const error = new ApiRequestFailed('boom');

    expect(error.statusCode).toBeUndefined();
    expect(error.url).toBeUndefined();
    expect(error.body).toBeUndefined();
  });
});
