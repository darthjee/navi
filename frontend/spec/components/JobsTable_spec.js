import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import JobsTable from '../../src/components/elements/JobsTable.jsx';

const render = (jobs) => renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(JobsTable, { jobs }))
);

describe('JobsTable', () => {
  describe('with jobs', () => {
    const jobs = [
      { id: 'abc', status: 'enqueued', attempts: 0, jobClass: 'ResourceRequestJob', url: null },
      { id: 'def', status: 'failed', attempts: 3, jobClass: 'HtmlParseJob', url: 'https://example.com' },
    ];

    it('renders a table', () => {
      expect(render(jobs)).toContain('<table');
    });

    it('renders table headers', () => {
      const html = render(jobs);
      expect(html).toContain('ID');
      expect(html).toContain('Status');
      expect(html).toContain('Attempts');
      expect(html).toContain('Class');
      expect(html).toContain('URL');
    });

    it('renders a row for each job', () => {
      const html = render(jobs);
      expect(html).toContain('abc');
      expect(html).toContain('def');
    });

    it('does not show the empty state message', () => {
      expect(render(jobs)).not.toContain('No jobs found');
    });
  });

  describe('with no jobs', () => {
    it('does not render a table', () => {
      expect(render([])).not.toContain('<table');
    });

    it('shows the empty state message', () => {
      expect(render([])).toContain('No jobs found');
    });
  });
});
