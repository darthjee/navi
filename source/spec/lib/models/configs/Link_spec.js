import { Link } from '../../../../lib/models/configs/Link.js';

describe('Link', () => {
  describe('.fromObject', () => {
    describe('when entry is a string', () => {
      it('uses URL as both url and text', () => {
        const link = Link.fromObject('https://example.com');
        expect(link.url).toEqual('https://example.com');
        expect(link.text).toEqual('https://example.com');
      });
    });

    describe('when entry is an object', () => {
      it('uses object fields as url and text', () => {
        const link = Link.fromObject({ text: 'Docs', url: 'https://example.com/docs' });
        expect(link.url).toEqual('https://example.com/docs');
        expect(link.text).toEqual('Docs');
      });
    });
  });

  describe('#toJSON', () => {
    it('returns url and text', () => {
      const link = new Link({ text: 'Home', url: 'https://example.com' });
      expect(link.toJSON()).toEqual({ text: 'Home', url: 'https://example.com' });
    });
  });
});
