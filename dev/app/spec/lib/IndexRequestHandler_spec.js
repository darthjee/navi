import path from 'path';
import IndexRequestHandler from '../../lib/IndexRequestHandler.js';

describe('IndexRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    res = { sendFile: jasmine.createSpy('sendFile') };
    handler = new IndexRequestHandler();
  });

  describe('#handle', () => {
    it('sends index.html from the static directory', () => {
      handler.handle({}, res);

      const [filePath] = res.sendFile.calls.mostRecent().args;
      expect(path.basename(filePath)).toEqual('index.html');
      expect(filePath).toContain(path.join('static', 'index.html'));
    });
  });
});
