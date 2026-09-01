import { ConfigurationFileNotFound } from '../../../../lib/exceptions/config/ConfigurationFileNotFound.js';
import { ConfigurationIncludeNotFound } from '../../../../lib/exceptions/config/ConfigurationIncludeNotFound.js';
import { ConfigIncluder } from '../../../../lib/services/config/ConfigIncluder.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';

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

  describe('debug logging of $VAR interpolation', () => {
    beforeEach(() => {
      spyOn(Logger, 'debug').and.stub();
      spyOn(Logger, 'warn').and.stub();
    });

    afterEach(() => {
      delete process.env.NAVI_TEST_INTERP_VAR;
    });

    it('emits a per-file summary line with placeholders: 0 for a file with no references', () => {
      const filePath = FixturesUtils.getFixturePath('config/sample_config.yml');

      ConfigIncluder.resolve(filePath);

      expect(Logger.debug).toHaveBeenCalledWith(
        `Config interpolation summary: ${filePath}`,
        { path: filePath, placeholders: 0, resolved: 0, missing: 0 },
      );
    });

    it('reports an unset variable as not defined, without length or hash', () => {
      const filePath = FixturesUtils.getFixturePath('config/split_config_with_env_vars/config.yml');

      ConfigIncluder.resolve(filePath);

      expect(Logger.debug).toHaveBeenCalledWith(
        'Config interpolation: $NAVI_TEST_INTERP_MISSING_VAR',
        { path: filePath, defined: false },
      );
    });

    describe('when the entry file declares an include: list', () => {
      let filePath;
      let includedFilePath;

      beforeEach(() => {
        process.env.NAVI_TEST_INTERP_VAR = 'resolved-value';
        filePath = FixturesUtils.getFixturePath('config/split_config_with_env_vars/config.yml');
        includedFilePath = FixturesUtils.getFixturePath('config/split_config_with_env_vars/included.yml');

        ConfigIncluder.resolve(filePath);
      });

      it('emits one debug line per distinct variable per file, deduped across repeated occurrences', () => {
        const includedVarCalls = Logger.debug.calls.allArgs()
          .filter(([message, attributes]) => {
            return message === 'Config interpolation: $NAVI_TEST_INTERP_VAR' && attributes.path === includedFilePath;
          });

        expect(includedVarCalls.length).toBe(1);
        expect(includedVarCalls[0]).toEqual([
          'Config interpolation: $NAVI_TEST_INTERP_VAR',
          jasmine.objectContaining({
            path: includedFilePath,
            defined: true,
            length: 'resolved-value'.length,
            hash: jasmine.any(String),
          }),
        ]);
      });

      it('emits a per-file summary line for the entry file with its own counts', () => {
        expect(Logger.debug).toHaveBeenCalledWith(
          `Config interpolation summary: ${filePath}`,
          { path: filePath, placeholders: 2, resolved: 1, missing: 1 },
        );
      });

      it('emits a per-file summary line for the included file with its own counts', () => {
        expect(Logger.debug).toHaveBeenCalledWith(
          `Config interpolation summary: ${includedFilePath}`,
          { path: includedFilePath, placeholders: 2, resolved: 2, missing: 0 },
        );
      });
    });
  });
});
