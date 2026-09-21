import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import Pagination, { paginationPages } from '../../src/components/Pagination.jsx';

describe('paginationPages', () => {
  describe('when totalPages <= 10', () => {
    it('returns all page numbers', () => {
      expect(paginationPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(paginationPages(3, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('when totalPages > 10', () => {
    describe('near the start (page 3 of 15)', () => {
      it('shows start pages, window, ellipsis, and end pages', () => {
        const pages = paginationPages(3, 15);
        expect(pages).toEqual([1, 2, 3, 4, null, 14, 15]);
      });
    });

    describe('in the middle (page 8 of 15)', () => {
      it('shows start, ellipsis, window, ellipsis, end', () => {
        const pages = paginationPages(8, 15);
        expect(pages).toEqual([1, 2, null, 7, 8, 9, null, 14, 15]);
      });
    });

    describe('near the end (page 13 of 15)', () => {
      it('shows start pages, ellipsis, window, and end pages', () => {
        const pages = paginationPages(13, 15);
        expect(pages).toEqual([1, 2, null, 12, 13, 14, 15]);
      });
    });

    describe('on the first page', () => {
      it('shows 1, 2 and end pages with ellipsis in between', () => {
        const pages = paginationPages(1, 20);
        expect(pages[0]).toBe(1);
        expect(pages[1]).toBe(2);
        expect(pages).toContain(null);
        expect(pages[pages.length - 1]).toBe(20);
      });
    });

    describe('on the last page', () => {
      it('includes the window at the end', () => {
        const pages = paginationPages(20, 20);
        expect(pages[pages.length - 1]).toBe(20);
        expect(pages[pages.length - 2]).toBe(19);
      });
    });
  });
});

describe('Pagination', () => {
  const state = useContainer();

  const render = async (props) => {
    await renderInAct(state.root, createElement(Pagination, props));
  };

  describe('with 5 pages, current page 3', () => {
    beforeEach(async () => {
      await render({ currentPage: 3, totalPages: 5, basePath: '/#/categories' });
    });

    it('renders a nav with pagination', () => {
      expect(state.container.querySelector('nav')).not.toBeNull();
      expect(state.container.querySelector('.pagination')).not.toBeNull();
    });

    it('marks page 3 as active', () => {
      const active = state.container.querySelector('.page-item.active');
      expect(active).not.toBeNull();
      expect(active.textContent).toContain('3');
    });

    it('renders prev and next arrows', () => {
      const links = Array.from(state.container.querySelectorAll('.page-link'));
      const texts = links.map((l) => l.textContent);
      expect(texts).toContain('«');
      expect(texts).toContain('»');
    });

    it('disables the prev arrow on the first page', async () => {
      await render({ currentPage: 1, totalPages: 5, basePath: '/#/categories' });
      const items = Array.from(state.container.querySelectorAll('.page-item'));
      const prev = items[0];
      expect(prev.classList.contains('disabled')).toBeTrue();
    });

    it('disables the next arrow on the last page', async () => {
      await render({ currentPage: 5, totalPages: 5, basePath: '/#/categories' });
      const items = Array.from(state.container.querySelectorAll('.page-item'));
      const next = items[items.length - 1];
      expect(next.classList.contains('disabled')).toBeTrue();
    });

    it('builds hrefs using basePath', () => {
      const links = Array.from(state.container.querySelectorAll('a.page-link'));
      const hrefs = links.map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/#/categories?page=1');
      expect(hrefs).toContain('/#/categories?page=5');
    });
  });

  describe('with many pages (15), current page 8', () => {
    beforeEach(async () => {
      await render({ currentPage: 8, totalPages: 15, basePath: '/#/categories' });
    });

    it('renders ellipsis spans', () => {
      const ellipses = Array.from(state.container.querySelectorAll('.page-item.disabled span.page-link'));
      expect(ellipses.length).toBeGreaterThan(0);
      expect(ellipses[0].textContent).toContain('…');
    });
  });
});
