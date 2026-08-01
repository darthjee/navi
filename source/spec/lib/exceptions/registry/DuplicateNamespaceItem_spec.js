import { AppError } from '../../../../lib/exceptions/AppError.js';
import { DuplicateNamespaceItem } from '../../../../lib/exceptions/registry/DuplicateNamespaceItem.js';

describe('DuplicateNamespaceItem', () => {
  let error;

  beforeEach(() => {
    error = new DuplicateNamespaceItem('people', { namespace: 'default', itemType: 'resource' });
  });

  it('has the correct name', () => {
    expect(error.name).toBe('DuplicateNamespaceItem');
  });

  it('has a message mentioning the item name and namespace', () => {
    expect(error.message).toBe('resource "people" is already declared in namespace "default".');
  });

  it('stores the item name', () => {
    expect(error.itemName).toBe('people');
  });

  it('stores the namespace', () => {
    expect(error.namespace).toBe('default');
  });

  it('stores the item type', () => {
    expect(error.itemType).toBe('resource');
  });

  it('defaults itemType to "Item" when omitted', () => {
    const defaultError = new DuplicateNamespaceItem('people', { namespace: 'default' });
    expect(defaultError.itemType).toBe('Item');
  });

  it('is an instance of AppError', () => {
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    expect(error).toBeInstanceOf(Error);
  });
});
