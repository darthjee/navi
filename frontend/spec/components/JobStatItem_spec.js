import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import JobStatItem from '../../src/components/JobStatItem.jsx';

const render = (props) => renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(JobStatItem, props))
);

describe('JobStatItem', () => {
  describe('rendering', () => {
    it('displays the value', () => {
      const html = render({ label: 'Enqueued', value: 5, variant: 'secondary', status: 'enqueued' });
      expect(html).toContain('5');
    });

    it('displays the label', () => {
      const html = render({ label: 'Enqueued', value: 5, variant: 'secondary', status: 'enqueued' });
      expect(html).toContain('Enqueued');
    });

    it('applies the variant CSS class to the card', () => {
      const html = render({ label: 'Enqueued', value: 5, variant: 'secondary', status: 'enqueued' });
      expect(html).toContain('text-bg-secondary');
    });
  });

  describe('link', () => {
    it('links to the jobs page for the given status', () => {
      const html = render({ label: 'Failed', value: 2, variant: 'danger', status: 'failed' });
      expect(html).toContain('href="/jobs/failed"');
    });

    it('builds the link from the status prop', () => {
      const html = render({ label: 'Dead', value: 0, variant: 'dark', status: 'dead' });
      expect(html).toContain('href="/jobs/dead"');
    });
  });
});
