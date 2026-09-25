import { Logger } from 'deku-sprout';
import { MenuConfig } from '../../../../lib/models/configs/MenuConfig.js';
import { MenuConfigFileUtils } from '../../../support/utils/MenuConfigFileUtils.js';

const { LOGS, MEMORY } = MenuConfigFileUtils;
const rendered = (path) => MenuConfigFileUtils.rendered(path);

describe('MenuConfig', () => {
  let dir;

  beforeEach(() => {
    dir = MenuConfigFileUtils.createTempDir();
  });

  afterEach(() => {
    MenuConfigFileUtils.removeTempDir(dir);
  });

  const write = (lines) => MenuConfigFileUtils.write(dir, lines);

  describe('.fromFile', () => {
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
      it('keeps the visible entries and appends the hidden route as a flagged entry', () => {
        spyOn(Logger, 'warn').and.stub();

        const path = write([
          'entries:',
          '  - route: /alpha',
          '    hidden: true',
          '  - route: /beta',
          '    text: Beta',
        ]);

        const entries = MenuConfig.fromFile(path);
        const visible = entries.filter((entry) => !entry.hidden);
        const hidden = entries.filter((entry) => entry.hidden);

        expect(visible.map((entry) => entry.toJSON()))
          .toEqual([LOGS, MEMORY, { route: '/beta', text: 'Beta' }]);
        expect(hidden.map((entry) => entry.route)).toEqual(['/alpha']);
        expect(Logger.warn).not.toHaveBeenCalledWith(
          jasmine.stringMatching(/hidden.*only valid on a default route/),
        );
      });

      it('de-duplicates repeated hidden non-default routes in file order', () => {
        const path = write([
          'entries:',
          '  - route: /gamma',
          '    hidden: true',
          '  - route: /alpha',
          '    hidden: true',
          '  - route: /gamma',
          '    hidden: true',
        ]);

        const hidden = MenuConfig.fromFile(path).filter((entry) => entry.hidden);

        expect(hidden.map((entry) => entry.route)).toEqual(['/gamma', '/alpha']);
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
  });
});
