/**
 * Computes the list of page numbers (and null for ellipsis) to show.
 *
 * @param {number} currentPage - The current page number (1-based).
 * @param {number} totalPages - Total number of pages.
 * @returns {Array<number|null>} Page numbers with null representing an ellipsis gap.
 */
export const paginationPages = (currentPage, totalPages) => {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const visible = new Set([
    1,
    2,
    totalPages - 1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    if (visible.has(i)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null);
    }
  }

  return pages;
};

/**
 * Bootstrap pagination component with ellipsis logic for large page counts.
 *
 * @param {object} props
 * @param {number} props.currentPage - The active page number (1-based).
 * @param {number} props.totalPages - Total number of pages.
 * @param {string} props.basePath - Base hash path, e.g. "/#/categories".
 * @returns {JSX.Element}
 */
function Pagination({ currentPage, totalPages, basePath }) {
  const pages = paginationPages(currentPage, totalPages);

  const pageUrl = (page) => `${basePath}?page=${page}`;

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination justify-content-center">
        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
          <a className="page-link" href={pageUrl(currentPage - 1)}>«</a>
        </li>

        {pages.map((page, index) => {
          if (page === null) {
            return (
              <li key={`ellipsis-${index}`} className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            );
          }

          return (
            <li key={page} className={`page-item${page === currentPage ? ' active' : ''}`}>
              <a className="page-link" href={pageUrl(page)}>{page}</a>
            </li>
          );
        })}

        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
          <a className="page-link" href={pageUrl(currentPage + 1)}>»</a>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
