import { TemplateStringRenderer } from '../../../../lib/models/request/TemplateStringRenderer.js';

describe('TemplateStringRenderer', () => {
  describe('.render', () => {
    describe('when the string is only a whole {:key} token', () => {
      it('returns the resolved value verbatim, unstringified, for an object value', () => {
        const address = { city: 'Springfield' };

        expect(TemplateStringRenderer.render('{:address}', { address })).toBe(address);
      });

      it('returns the resolved value verbatim, unstringified, for an array value', () => {
        const tags = ['a', 'b'];

        expect(TemplateStringRenderer.render('{:tags}', { tags })).toBe(tags);
      });

      it('returns the resolved value verbatim for the {:.} whole-item token', () => {
        const item = { id: 1, name: 'Widget' };

        expect(TemplateStringRenderer.render('{:.}', item)).toBe(item);
      });
    });

    describe('when the token is embedded in a longer string', () => {
      it('stringifies a resolved number value', () => {
        expect(TemplateStringRenderer.render('note {:id} extracted', { id: 42 })).toEqual('note 42 extracted');
      });

      it('stringifies a resolved null value', () => {
        expect(TemplateStringRenderer.render('value: {:value}', { value: null })).toEqual('value: null');
      });
    });

    describe('when the token is unresolved (undefined)', () => {
      it('leaves the literal token for a whole-token string', () => {
        expect(TemplateStringRenderer.render('{:missing}', {})).toEqual('{:missing}');
      });

      it('leaves the literal token embedded in the surrounding string', () => {
        expect(TemplateStringRenderer.render('note {:missing} extracted', {})).toEqual('note {:missing} extracted');
      });
    });

    describe('when the resolved value is falsy but defined', () => {
      it('renders null as a whole-token value', () => {
        expect(TemplateStringRenderer.render('{:value}', { value: null })).toBeNull();
      });

      it('renders 0 as a whole-token value', () => {
        expect(TemplateStringRenderer.render('{:value}', { value: 0 })).toBe(0);
      });

      it('renders false as a whole-token value', () => {
        expect(TemplateStringRenderer.render('{:value}', { value: false })).toBe(false);
      });

      it("renders '' as a whole-token value", () => {
        expect(TemplateStringRenderer.render('{:value}', { value: '' })).toBe('');
      });
    });
  });
});
