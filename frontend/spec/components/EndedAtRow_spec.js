import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EndedAtRow from '../../src/components/elements/EndedAtRow.jsx';

const render = (job) => renderToStaticMarkup(createElement(EndedAtRow, { job }));

describe('EndedAtRow', () => {
  describe('when endedAt is set', () => {
    it('renders the label and timestamp', () => {
      const html = render({ endedAt: '2026-01-02T03:04:05.000Z' });
      expect(html).toContain('Ended at');
      expect(html).toContain('2026');
    });
  });

  describe('when endedAt is null', () => {
    it('renders nothing', () => {
      expect(render({ endedAt: null })).toBe('');
    });
  });
});
