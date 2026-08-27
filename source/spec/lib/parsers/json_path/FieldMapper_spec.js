import { FieldMapper } from '../../../../lib/parsers/json_path/FieldMapper.js';

describe('FieldMapper', () => {
  describe('#map', () => {
    describe('when fields has a single mapping', () => {
      it('returns the item remapped to the output key', () => {
        const mapper = new FieldMapper({ obj_inid: 'inid' });
        const item = { obj_inid: 1 };

        expect(mapper.map(item)).toEqual({ inid: 1 });
      });
    });

    describe('when fields has multiple mappings', () => {
      it('returns the item remapped to every output key', () => {
        const mapper = new FieldMapper({
          obj_inid: 'inid',
          obj_title: 'name',
          obj_post_id: 'post_id',
        });
        const item = { obj_inid: 1, obj_title: 'Miniature A', obj_post_id: 10 };

        expect(mapper.map(item)).toEqual({ inid: 1, name: 'Miniature A', post_id: 10 });
      });
    });

    describe('when a source key is absent from the item', () => {
      it('maps the output key to undefined', () => {
        const mapper = new FieldMapper({ missing_key: 'value' });
        const item = { obj_inid: 1 };

        expect(mapper.map(item)).toEqual({ value: undefined });
      });
    });
  });
});
