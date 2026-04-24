import { AssetRequest } from '../../../lib/models/AssetRequest.js';

describe('AssetRequest', () => {
  describe('.fromObject', () => {
    describe('with all fields', () => {
      it('returns an AssetRequest with all values set', () => {
        const obj = { selector: 'link[rel="stylesheet"]', attribute: 'href', client: 'cdn', status: 200 };
        const assetRequest = AssetRequest.fromObject(obj);

        expect(assetRequest.selector).toBe('link[rel="stylesheet"]');
        expect(assetRequest.attribute).toBe('href');
        expect(assetRequest.client).toBe('cdn');
        expect(assetRequest.status).toBe(200);
      });
    });

    describe('with only required fields', () => {
      it('sets client to undefined and status defaults to 200', () => {
        const obj = { selector: 'img[src]', attribute: 'src' };
        const assetRequest = AssetRequest.fromObject(obj);

        expect(assetRequest.selector).toBe('img[src]');
        expect(assetRequest.attribute).toBe('src');
        expect(assetRequest.client).toBeUndefined();
        expect(assetRequest.status).toBe(200);
      });
    });
  });

  describe('.fromListObject', () => {
    describe('with a list of objects', () => {
      it('returns an array of AssetRequest instances', () => {
        const list = [
          { selector: 'link[rel="stylesheet"]', attribute: 'href' },
          { selector: 'script[src]', attribute: 'src', client: 'cdn', status: 200 },
        ];

        const result = AssetRequest.fromListObject(list);

        expect(result.length).toBe(2);
        expect(result.every((r) => r instanceof AssetRequest)).toBeTrue();
        expect(result[0].selector).toBe('link[rel="stylesheet"]');
        expect(result[1].client).toBe('cdn');
      });
    });

    describe('with an empty list', () => {
      it('returns an empty array', () => {
        expect(AssetRequest.fromListObject([])).toEqual([]);
      });
    });

    describe('with no argument', () => {
      it('returns an empty array', () => {
        expect(AssetRequest.fromListObject()).toEqual([]);
      });
    });
  });
});
