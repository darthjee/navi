import { ItemNotFound } from '../../../../lib/exceptions/registry/ItemNotFound.js';
import { NamespaceNotFound } from '../../../../lib/exceptions/registry/NamespaceNotFound.js';

describe('NamespaceNotFound', () => {
  let error;

  beforeEach(() => {
    error = new NamespaceNotFound('paginated');
  });

  it('has the correct name', () => {
    expect(error.name).toBe('NamespaceNotFound');
  });

  it('has a message mentioning the namespace name', () => {
    expect(error.message).toBe('Namespace "paginated" not found.');
  });

  it('stores the namespace name', () => {
    expect(error.namespaceName).toBe('paginated');
  });

  it('is an instance of ItemNotFound', () => {
    expect(error).toBeInstanceOf(ItemNotFound);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
