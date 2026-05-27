import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import JobRow from '../../src/components/elements/JobRow.jsx';

const render = (job) => renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(JobRow, { job }))
);

describe('JobRow', () => {
  const job = {
    id: 'abc123',
    status: 'enqueued',
    attempts: 2,
    jobClass: 'ResourceRequestJob',
    url: 'https://example.com',
  };

  it('renders a table row', () => {
    expect(render(job)).toContain('<tr');
  });

  it('renders the job id as a link', () => {
    const html = render(job);
    expect(html).toContain('abc123');
    expect(html).toContain('href="/job/abc123"');
  });

  it('renders the job status badge', () => {
    expect(render(job)).toContain('enqueued');
    expect(render(job)).toContain('badge');
    expect(render(job)).toContain('text-bg-secondary');
  });

  it('renders the attempts count', () => {
    expect(render(job)).toContain('2');
  });

  it('renders the job class', () => {
    expect(render(job)).toContain('ResourceRequestJob');
  });

  it('renders the url', () => {
    expect(render(job)).toContain('https://example.com');
  });

  describe('when url is absent', () => {
    const jobWithoutUrl = { ...job, url: null };

    it('renders an em dash', () => {
      expect(render(jobWithoutUrl)).toContain('—');
    });
  });
});
