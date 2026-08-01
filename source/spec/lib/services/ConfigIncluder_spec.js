import { ConfigurationFileNotFound } from '../../../lib/exceptions/config/ConfigurationFileNotFound.js';
import { ConfigurationIncludeNotFound } from '../../../lib/exceptions/config/ConfigurationIncludeNotFound.js';
import { ConfigIncluder } from '../../../lib/services/ConfigIncluder.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

describe('ConfigIncluder', () => {
  describe('.resolve', () => {
    describe('when the file has no include: key', () => {
      it('returns a single entry for the entry file, defaulting to the default namespace', () => {
        const filePath = FixturesUtils.getFixturePath('config/sample_config.yml');

        const files = ConfigIncluder.resolve(filePath);

        expect(files.length).toBe(1);
        expect(files[0].namespace).toBe('default');
        expect(files[0].filePath).toBe(filePath);
        expect(files[0].resources.categories).toBeDefined();
        expect(files[0].clients.default).toBeDefined();
      });
    });

    describe('when the entry file declares an include: list', () => {
      let filePath;
      let files;

      beforeEach(() => {
        filePath = FixturesUtils.getFixturePath('config/split_config/config.yml');
        files = ConfigIncluder.resolve(filePath);
      });

      it('returns one entry per file in the include chain', () => {
        expect(files.length).toBe(3);
      });

      it('defaults the entry file to the default namespace', () => {
        const entry = files.find((file) => file.filePath === filePath);
        expect(entry.namespace).toBe('default');
        expect(entry.resources.people).toBeDefined();
      });

      it('reads the declared namespace of an included file', () => {
        const paginated = files.find((file) => file.namespace === 'paginated');
        expect(paginated.resources.paginated_people).toBeDefined();
      });

      it('resolves include paths relative to the including file directory', () => {
        const clients = files.find((file) => file.namespace === 'clients');
        expect(clients.clients['non-default']).toBeDefined();
      });
    });

    describe('when an included file cannot be found', () => {
      it('throws ConfigurationIncludeNotFound and logs the error', () => {
        spyOn(Logger, 'error').and.stub();
        const filePath = FixturesUtils.getFixturePath('config/missing_include/config.yml');

        expect(() => ConfigIncluder.resolve(filePath)).toThrowError(ConfigurationIncludeNotFound);
        expect(Logger.error).toHaveBeenCalled();
      });
    });

    describe('when the entry file cannot be found', () => {
      it('throws ConfigurationFileNotFound and logs the error', () => {
        spyOn(Logger, 'error').and.stub();

        expect(() => ConfigIncluder.resolve('non-existing.yml')).toThrowError(ConfigurationFileNotFound);
        expect(Logger.error).toHaveBeenCalled();
      });
    });

    describe('when the same file is included more than once', () => {
      it('is only read once', () => {
        const filePath = FixturesUtils.getFixturePath('config/duplicate_include/config.yml');

        const files = ConfigIncluder.resolve(filePath);

        expect(files.filter((file) => file.namespace === 'shared').length).toBe(1);
      });
    });
  });

  describe('#entryRaw', () => {
    it('exposes the entry file raw parsed object', () => {
      const filePath = FixturesUtils.getFixturePath('config/sample_config.yml');
      const includer = new ConfigIncluder(filePath);
      includer.resolve();

      expect(includer.entryRaw.workers.quantity).toBe(5);
    });
  });
});
