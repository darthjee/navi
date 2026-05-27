import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import JobStatusBadge from '../../src/components/elements/JobStatusBadge.jsx';

const render = (status) => renderToStaticMarkup(createElement(JobStatusBadge, { status }));

describe('JobStatusBadge', () => {
  it('renders a badge with the status text', () => {
    expect(render('enqueued')).toContain('enqueued');
  });

  it('applies the correct variant class for enqueued', () => {
    expect(render('enqueued')).toContain('text-bg-secondary');
  });

  it('applies the correct variant class for processing', () => {
    expect(render('processing')).toContain('text-bg-primary');
  });

  it('applies the correct variant class for failed', () => {
    expect(render('failed')).toContain('text-bg-danger');
  });

  it('applies the correct variant class for finished', () => {
    expect(render('finished')).toContain('text-bg-success');
  });

  it('applies the correct variant class for dead', () => {
    expect(render('dead')).toContain('text-bg-dark');
  });

  it('falls back to secondary for an unknown status', () => {
    expect(render('unknown')).toContain('text-bg-secondary');
  });

  it('renders a badge element', () => {
    expect(render('enqueued')).toContain('badge');
  });
});
