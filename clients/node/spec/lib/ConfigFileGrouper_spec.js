import { ConfigFileGrouper } from '../../lib/ConfigFileGrouper.js';
import { ConfigFileParser } from '../../lib/ConfigFileParser.js';

describe('ConfigFileGrouper', () => {
  describe('.group', () => {
    it('groups a single file into a single-namespace group', () => {
      spyOn(ConfigFileParser, 'parse').and.returnValue({
        namespace: 'reports', resources: { a: 1 }, clients: { c: 1 },
      });

      const result = ConfigFileGrouper.group([{ path: 'a.yml', mode: 'auto' }]);

      expect(result).toEqual([{ namespace: 'reports', resources: { a: 1 }, clients: { c: 1 } }]);
    });

    it('preserves the order of first appearance across distinct namespaces', () => {
      spyOn(ConfigFileParser, 'parse').and.returnValues(
        { namespace: 'ns1', resources: { a: 1 }, clients: {} },
        { namespace: 'ns2', resources: { b: 1 }, clients: {} },
        { namespace: 'ns1', resources: { c: 1 }, clients: {} },
      );

      const result = ConfigFileGrouper.group([
        { path: 'a.yml', mode: 'auto' },
        { path: 'b.yml', mode: 'auto' },
        { path: 'c.yml', mode: 'auto' },
      ]);

      expect(result.map((group) => { return group.namespace; })).toEqual(['ns1', 'ns2']);
    });

    it('merges same-namespace resources/clients, later files winning on collision', () => {
      spyOn(ConfigFileParser, 'parse').and.returnValues(
        { namespace: 'ns1', resources: { shared: 'first', a: 1 }, clients: { api: 'first' } },
        { namespace: 'ns1', resources: { shared: 'second', b: 1 }, clients: { api: 'second' } },
      );

      const result = ConfigFileGrouper.group([
        { path: 'a.yml', mode: 'auto' },
        { path: 'b.yml', mode: 'auto' },
      ]);

      expect(result).toEqual([{
        namespace: 'ns1',
        resources: { shared: 'second', a: 1, b: 1 },
        clients: { api: 'second' },
      }]);
    });

    it('parses every entry with its given path and mode', () => {
      spyOn(ConfigFileParser, 'parse').and.returnValue({ namespace: 'default', resources: {}, clients: {} });

      ConfigFileGrouper.group([
        { path: 'a.yml', mode: 'yaml' },
        { path: 'b.json', mode: 'json' },
      ]);

      expect(ConfigFileParser.parse).toHaveBeenCalledWith('a.yml', 'yaml');
      expect(ConfigFileParser.parse).toHaveBeenCalledWith('b.json', 'json');
    });

    it('fails fast, propagating the first parse error without returning a partial result', () => {
      spyOn(ConfigFileParser, 'parse').and.callFake((path) => {
        if (path === 'bad.yml') throw new Error('boom');
        return { namespace: 'default', resources: {}, clients: {} };
      });

      expect(() => {
        ConfigFileGrouper.group([
          { path: 'good.yml', mode: 'auto' },
          { path: 'bad.yml', mode: 'auto' },
          { path: 'unreached.yml', mode: 'auto' },
        ]);
      }).toThrowError('boom');
    });
  });
});
