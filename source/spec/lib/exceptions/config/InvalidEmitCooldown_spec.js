import { AppError } from '../../../../lib/common/exceptions/AppError.js';
import { InvalidEmitCooldown } from '../../../../lib/exceptions/config/InvalidEmitCooldown.js';

describe('InvalidEmitCooldown', () => {
  let error;

  beforeEach(() => {
    error = new InvalidEmitCooldown(-1);
  });

  it('has the correct name', () => {
    expect(error.name).toBe('InvalidEmitCooldown');
  });

  it('has a message naming the invalid value', () => {
    expect(error.message).toBe('Invalid emit cooldown: -1. Expected a non-negative number');
  });

  it('exposes the cooldown value', () => {
    expect(error.cooldown).toEqual(-1);
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
