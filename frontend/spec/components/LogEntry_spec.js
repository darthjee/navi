import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LogEntry from '../../src/components/elements/LogEntry.jsx';

const render = (log) => renderToStaticMarkup(createElement(LogEntry, { log }));

describe('LogEntry', () => {
  it('renders the log message', () => {
    const log = { id: 1, level: 'info', message: 'Server started', timestamp: '2024-01-01T00:00:00Z' };
    expect(render(log)).toContain('Server started');
  });

  it('renders the timestamp in brackets', () => {
    const log = { id: 1, level: 'info', message: 'Server started', timestamp: '2024-01-01T00:00:00Z' };
    expect(render(log)).toContain('[2024-01-01T00:00:00Z]');
  });

  it('renders the level in brackets', () => {
    const log = { id: 1, level: 'warn', message: 'High memory', timestamp: '2024-01-01T00:00:00Z' };
    expect(render(log)).toContain('[warn]');
  });

  it('applies text-warning class for warn level', () => {
    const log = { id: 1, level: 'warn', message: 'High memory', timestamp: '2024-01-01T00:00:00Z' };
    expect(render(log)).toContain('text-warning');
  });

  it('applies text-danger class for error level', () => {
    const log = { id: 1, level: 'error', message: 'Crash', timestamp: '2024-01-01T00:00:00Z' };
    expect(render(log)).toContain('text-danger');
  });

  it('applies text-debug class for debug level', () => {
    const log = { id: 1, level: 'debug', message: 'Cache hit', timestamp: '2024-01-01T00:00:00Z' };
    expect(render(log)).toContain('text-debug');
  });

  it('does not apply a colour class for info level', () => {
    const log = { id: 1, level: 'info', message: 'All good', timestamp: '2024-01-01T00:00:00Z' };
    const html = render(log);
    expect(html).not.toContain('text-warning');
    expect(html).not.toContain('text-danger');
    expect(html).not.toContain('text-debug');
  });
});
