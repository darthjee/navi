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
    endedAt: null,
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

  describe('when endedAt is set', () => {
    it('renders the formatted timestamp', () => {
      const html = render({ ...job, endedAt: '2026-01-02T03:04:05.000Z' });
      expect(html).toContain('2026');
    });
  });

  describe('when endedAt is null', () => {
    it('renders an em dash in the ended at cell', () => {
      const html = render(job);
      expect(html.match(/—/g).length).toBe(1);
    });
  });
});
