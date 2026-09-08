import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '../../../../lib/common/utils/logging/Logger.js';
import { MenuConfigurationInvalid } from '../../../../lib/exceptions/config/MenuConfigurationInvalid.js';
import { MenuConfig } from '../../../../lib/models/configs/MenuConfig.js';
import { MenuEntry } from '../../../../lib/models/configs/MenuEntry.js';

describe('MenuConfig', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'menu-config-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const write = (lines) => {
    const content = Array.isArray(lines) ? lines.join('\n') : lines;
    const path = join(dir, 'menu.yml');
    writeFileSync(path, content, 'utf8');
    return path;
  };

  const rendered = (path) => MenuConfig.fromFile(path).map((entry) => entry.toJSON());

  const LOGS = { route: '/logs', text: 'Logs' };
  const MEMORY = { route: '/memory/status', text: 'Memory' };

  describe('.DEFAULT_ENTRIES', () => {
    it('is the Logs + Memory menu', () => {
      expect(MenuConfig.DEFAULT_ENTRIES.map((entry) => entry.toJSON())).toEqual([LOGS, MEMORY]);
    });
  });

  describe('.DEFAULT_ROUTES', () => {
    it('lists the known default routes in shipped order', () => {
      expect(MenuConfig.DEFAULT_ROUTES).toEqual(['/logs', '/memory/status']);
    });
  });

  describe('.defaultLabel', () => {
    it('maps a known default route to its shipped label', () => {
      expect(MenuConfig.defaultLabel('/logs')).toEqual('Logs');
      expect(MenuConfig.defaultLabel('/memory/status')).toEqual('Memory');
    });

    it('returns undefined for a non-default route', () => {
      expect(MenuConfig.defaultLabel('/dashboard')).toBeUndefined();
    });
  });

  describe('.fromFile', () => {
    describe('when the file does not exist', () => {
      it('returns the default entries', () => {
        expect(rendered(join(dir, 'missing.yml'))).toEqual([LOGS, MEMORY]);
      });
    });

    describe('when the file is empty', () => {
      it('returns the default entries', () => {
        expect(rendered(write(''))).toEqual([LOGS, MEMORY]);
      });
    });

    describe('when the file is whitespace-only', () => {
      it('returns the default entries', () => {
        expect(rendered(write('   \n  \n'))).toEqual([LOGS, MEMORY]);
      });
    });

    describe('when the file is fully commented out', () => {
      it('returns the default entries', () => {
        expect(rendered(write(['# entries:', '#   - route: /dashboard']))).toEqual([LOGS, MEMORY]);
      });
    });

    describe('when the document carries neither entries nor defaults', () => {
      it('returns the default entries', () => {
        expect(rendered(write('other: value\n'))).toEqual([LOGS, MEMORY]);
      });
    });

    describe('when entries is an explicit empty list', () => {
      it('still renders the Logs + Memory defaults', () => {
        expect(rendered(write('entries: []\n'))).toEqual([LOGS, MEMORY]);
      });
    });

    describe('when entries lists custom mappings', () => {
      it('renders them after the defaults, in file order', () => {
        const path = write([
          'entries:',
          '  - route: /alpha',
          '    text: Alpha',
          '  - route: /beta',
          '    text: Beta',
        ]);

        expect(MenuConfig.fromFile(path)[0]).toBeInstanceOf(MenuEntry);
        expect(rendered(path)).toEqual([
          LOGS,
          MEMORY,
          { route: '/alpha', text: 'Alpha' },
          { route: '/beta', text: 'Beta' },
        ]);
      });
    });

    describe('when defaults is false', () => {
      it('renders only the operator entries', () => {
        const path = write([
          'defaults: false',
          'entries:',
          '  - route: /alpha',
          '    text: Alpha',
        ]);

        expect(rendered(path)).toEqual([{ route: '/alpha', text: 'Alpha' }]);
      });

      it('renders an empty menu when there is no entries key', () => {
        expect(MenuConfig.fromFile(write('defaults: false\n'))).toEqual([]);
      });
    });

    describe('when defaults is not a boolean', () => {
      it('warns and behaves as true', () => {
        spyOn(Logger, 'warn').and.stub();

        const path = write(['defaults: maybe', 'entries: []']);

        expect(rendered(path)).toEqual([LOGS, MEMORY]);
        expect(Logger.warn).toHaveBeenCalledWith(
          '[menu] ignoring non-boolean "defaults" value; treating as true',
        );
      });
    });

    describe('when hidden is true on a default route', () => {
      it('drops that default and never renders the hidden entry', () => {
        const path = write([
          'entries:',
          '  - route: /logs',
          '    hidden: true',
          '  - route: /alpha',
          '    text: Alpha',
        ]);

        expect(rendered(path)).toEqual([MEMORY, { route: '/alpha', text: 'Alpha' }]);
      });
    });

    describe('when hidden is true on a non-default route', () => {
      it('drops the entry with a warning and leaves the rest intact', () => {
        spyOn(Logger, 'warn').and.stub();

        const path = write([
          'entries:',
          '  - route: /alpha',
          '    hidden: true',
          '  - route: /beta',
          '    text: Beta',
        ]);

        expect(rendered(path)).toEqual([LOGS, MEMORY, { route: '/beta', text: 'Beta' }]);
        expect(Logger.warn).toHaveBeenCalledWith(
          '[menu] skipping entry at index 0: "hidden" is only valid on a default route',
        );
      });
    });

    describe('when a custom entry repositions a default', () => {
      it('pulls the default to the custom file position without duplicating it', () => {
        const path = write([
          'entries:',
          '  - route: /dashboard',
          '  - route: /logs',
        ]);

        expect(rendered(path)).toEqual([
          MEMORY,
          { route: '/dashboard', text: '/dashboard' },
          { route: '/logs', text: 'Logs' },
        ]);
      });

      it('relabels the repositioned default when text is supplied', () => {
        const path = write([
          'entries:',
          '  - route: /logs',
          '    text: Application Logs',
        ]);

        expect(rendered(path)).toEqual([
          MEMORY,
          { route: '/logs', text: 'Application Logs' },
        ]);
      });

      it('keeps the shipped label on a bare re-list', () => {
        const path = write(['entries:', '  - route: /logs']);

        expect(rendered(path)).toEqual([MEMORY, { route: '/logs', text: 'Logs' }]);
      });
    });

    describe('when a route is duplicated in the merged list', () => {
      it('keeps the first and drops the rest with merged-index warnings', () => {
        spyOn(Logger, 'warn').and.stub();

        const path = write([
          'entries:',
          '  - route: /dashboard',
          '    text: Dash',
          '  - route: /dashboard',
          '    text: Dash Again',
        ]);

        expect(rendered(path)).toEqual([LOGS, MEMORY, { route: '/dashboard', text: 'Dash' }]);
        expect(Logger.warn).toHaveBeenCalledWith(
          '[menu] skipping duplicate entry at index 3: route "/dashboard" already defined at index 2',
        );
      });
    });

    describe('when a custom entry reuses a default label on a different route', () => {
      it('is allowed with no warning', () => {
        spyOn(Logger, 'warn').and.stub();

        const path = write([
          'entries:',
          '  - route: /audit',
          '    text: Logs',
        ]);

        expect(rendered(path)).toEqual([LOGS, MEMORY, { route: '/audit', text: 'Logs' }]);
        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });

    describe('when one entry is malformed among valid ones', () => {
      it('drops it and warns with the raw entries index', () => {
        spyOn(Logger, 'warn').and.stub();
        const path = write([
          'entries:',
          '  - route: /logs',
          '    text: Logs',
          '  - route: bad route',
          '  - route: /memory/status',
        ]);

        const entries = MenuConfig.fromFile(path);

        expect(entries.map((entry) => entry.route)).toEqual(['/logs', '/memory/status']);
        expect(Logger.warn).toHaveBeenCalledWith(
          jasmine.stringMatching(/\[menu\] skipping invalid entry at index 1/),
        );
      });
    });

    describe('when the YAML cannot be parsed', () => {
      it('throws MenuConfigurationInvalid', () => {
        const path = write('entries: [ unterminated\n');
        expect(() => MenuConfig.fromFile(path)).toThrowError(MenuConfigurationInvalid);
      });
    });

    describe('when entries is present but not a list', () => {
      it('throws MenuConfigurationInvalid', () => {
        const path = write('entries:\n  route: /logs\n');
        expect(() => MenuConfig.fromFile(path)).toThrowError(MenuConfigurationInvalid);
      });
    });

    describe('when the file references an environment variable', () => {
      it('interpolates it before parsing, alongside defaults', () => {
        process.env.MENU_SPEC_TEXT = 'Interpolated';
        const path = write([
          'defaults: true',
          'entries:',
          '  - route: /alpha',
          '    text: ${MENU_SPEC_TEXT}',
        ]);

        try {
          expect(rendered(path)).toEqual([
            LOGS,
            MEMORY,
            { route: '/alpha', text: 'Interpolated' },
          ]);
        } finally {
          delete process.env.MENU_SPEC_TEXT;
        }
      });
    });
  });
});
