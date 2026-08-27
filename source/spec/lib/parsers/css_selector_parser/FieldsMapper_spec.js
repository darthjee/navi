import { FieldsMapper } from '../../../../lib/parsers/css_selector_parser/FieldsMapper.js';

describe('FieldsMapper', () => {
  describe('#map', () => {
    describe('when fields mix scalar, array, and no-selector configurations', () => {
      it('maps every output field with the corresponding resolver', () => {
        const title = { text: '  Widget  ' };
        const tags = [{ text: 'new' }, { text: 'sale' }];
        const container = {
          text: '  Container  ',
          querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
            selector === 'h2' ? title : null
          )),
          querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue(tags),
        };
        const fields = {
          title: { selector: 'h2' },
          tags: { selector: '.tag', array: true },
          container: null,
        };

        expect(new FieldsMapper(fields).map(container)).toEqual({
          title: 'Widget',
          tags: ['new', 'sale'],
          container: 'Container',
        });
      });
    });

    describe('when a scalar selector matches nothing', () => {
      it('maps the field to null', () => {
        const container = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(null),
        };

        expect(new FieldsMapper({ title: { selector: 'h2' } }).map(container))
          .toEqual({ title: null });
      });
    });

    describe('when a field config is undefined', () => {
      it('treats it as an empty configuration', () => {
        const container = { text: '  Widget  ' };

        expect(new FieldsMapper({ title: undefined }).map(container))
          .toEqual({ title: 'Widget' });
      });
    });
  });
});
