import { Link, useLocation } from 'react-router-dom';
import ErrorAlert from './ErrorAlert.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import Pagination from './Pagination.jsx';
import useFetchData from '../hooks/useFetchData.js';

/**
 * Fetches and renders a paginated list of named resources, driven by the
 * current location query string.
 *
 * @param {object} props
 * @param {string} props.title - Heading shown above the list.
 * @param {function(string): Promise<{data: Array<object>, pagination: object}>} props.fetchPage -
 *   Fetches a page given the query string (without the leading "?").
 * @param {function(object): string} props.itemPath - Builds the link path for an item.
 * @param {string} props.basePath - Base hash path used by the pagination links.
 * @param {*} [props.resourceId] - Extra dependency that triggers a refetch when changed.
 * @returns {JSX.Element}
 */
function PaginatedList({ title, fetchPage, itemPath, basePath, resourceId }) {
  const { search } = useLocation();
  const queryString = search ? search.slice(1) : '';
  const { data: result, error, loading } = useFetchData(
    () => fetchPage(queryString),
    [queryString, resourceId]
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  const { data: items, pagination } = result;

  return (
    <div className="container mt-4">
      <h1>{title}</h1>
      <ul className="list-group mt-3">
        {items.map((item) => (
          <li key={item.id} className="list-group-item">
            <Link to={itemPath(item)}>{item.name}</Link>
          </li>
        ))}
      </ul>
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          basePath={basePath}
        />
      )}
    </div>
  );
}

export default PaginatedList;
