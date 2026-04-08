import { MissingActionResource } from '../../../lib/exceptions/MissingActionResource.js';
import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { ResourceRequestAction } from '../../../lib/models/ResourceRequestAction.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ResourceRequestActionFactory } from '../../support/factories/ResourceRequestActionFactory.js';

describe('ResourceRequestAction', () => {
  beforeEach(() => {
    spyOn(Logger, 'info').and.stub();
    spyOn(Logger, 'error').and.stub();
  });

  describe('constructor', () => {
    describe('when resource is missing', () => {
      it('throws MissingActionResource', () => {
        expect(() => new ResourceRequestAction({ resource: undefined }))
          .toThrowMatching((error) => error instanceof MissingActionResource);
      });
    });
  });

  describe('.fromList', () => {
    describe('when called with undefined', () => {
      it('returns an empty array', () => {
        expect(ResourceRequestAction.fromList()).toEqual([]);
      });
    });

    describe('when called with an empty array', () => {
      it('returns an empty array', () => {
        expect(ResourceRequestAction.fromList([])).toEqual([]);
      });
    });

    describe('when all entries are valid', () => {
      it('returns one instance per entry', () => {
        const list = ResourceRequestAction.fromList([
          { resource: 'products', variables_map: { id: 'category_id' } },
          { resource: 'category_information' },
        ]);
        expect(list.length).toBe(2);
        expect(list.every((a) => a instanceof ResourceRequestAction)).toBeTrue();
      });
    });

    describe('when one entry is missing resource', () => {
      it('logs the error and skips that entry', () => {
        const list = ResourceRequestAction.fromList([
          { resource: 'products' },
          { resource: undefined },
        ]);
        expect(list.length).toBe(1);
        expect(Logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('#execute', () => {
    const item = { id: 1, name: 'Electronics' };

    describe('without variables_map', () => {
      it('logs the item as-is', () => {
        ResourceRequestActionFactory.build({ resource: 'products' }).execute(item);
        expect(Logger.info).toHaveBeenCalledWith(
          `Executing action products for ${JSON.stringify(item)}`
        );
      });
    });

    describe('with variables_map', () => {
      it('logs the mapped variables', () => {
        ResourceRequestActionFactory.build({
          resource: 'products',
          variables_map: { id: 'category_id' },
        }).execute(item);
        expect(Logger.info).toHaveBeenCalledWith(
          'Executing action products for {"category_id":1}'
        );
      });
    });

    describe('when a mapped variable is missing from the item', () => {
      it('throws MissingMappingVariable', () => {
        const action = ResourceRequestActionFactory.build({
          resource: 'products',
          variables_map: { missing_field: 'dest' },
        });
        expect(() => action.execute(item))
          .toThrowMatching((error) => error instanceof MissingMappingVariable);
      });
    });
  });
});
