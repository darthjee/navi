import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import StatsDisplay from '../../src/components/elements/StatsDisplay.jsx';
import { useContainer } from '../support/dom.js';

const stats = {
  workers: { idle: 3, busy: 1 },
  jobs: { enqueued: 5, processing: 2, failed: 1, finished: 10, dead: 0 },
  emissions: { extracted: 12, emitted: 9, failed: 2, dead: 1 },
};

const renderStatsDisplay = async (root, props) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(StatsDisplay, props)));
  });
};

describe('StatsDisplay', () => {
  const state = useContainer();

  describe('the Emissions group', () => {
    beforeEach(async () => {
      await renderStatsDisplay(state.root, { stats });
    });

    it('renders the Emissions section label', () => {
      expect(state.container.textContent).toContain('Emissions');
    });

    it('renders all four emission stat items', () => {
      const text = state.container.textContent;
      expect(text).toContain('Extracted');
      expect(text).toContain('Emitted');
      expect(text).toContain('Failed');
      expect(text).toContain('Dead');
    });

    it('shows the extracted count', () => {
      const cards = Array.from(state.container.querySelectorAll('.card'));
      const card = cards.find((c) => c.textContent.includes('Extracted'));
      expect(card.textContent).toContain('12');
    });

    it('shows the emitted count', () => {
      const cards = Array.from(state.container.querySelectorAll('.card'));
      const card = cards.find((c) => c.textContent.includes('Emitted'));
      expect(card.textContent).toContain('9');
    });

    it('links Extracted to the /extractions page', () => {
      const links = Array.from(state.container.querySelectorAll('a'));
      const link = links.find((a) => a.textContent.includes('Extracted'));
      expect(link.getAttribute('href')).toBe('/extractions');
    });

    it('links Emitted to the /emissions page', () => {
      const links = Array.from(state.container.querySelectorAll('a'));
      const link = links.find((a) => a.textContent.includes('Emitted'));
      expect(link.getAttribute('href')).toBe('/emissions');
    });

    it('links Dead emissions to the /emissions page', () => {
      const links = Array.from(state.container.querySelectorAll('a'));
      const hrefs = links.map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/emissions');
    });
  });

  describe('with zero emission counts', () => {
    beforeEach(async () => {
      await renderStatsDisplay(state.root, {
        stats: { ...stats, emissions: { extracted: 0, emitted: 0, failed: 0, dead: 0 } },
      });
    });

    it('still renders the Emissions group', () => {
      expect(state.container.textContent).toContain('Emissions');
    });
  });
});
