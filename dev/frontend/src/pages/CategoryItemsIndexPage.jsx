import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchItems } from '../clients/ItemsClient.js';
import Pagination from '../components/Pagination.jsx';

function CategoryItemsIndexPage() {
  const { id } = useParams();
  const [items, setItems] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();

  useEffect(() => {
    const queryString = search ? search.slice(1) : '';

    setLoading(true);
    fetchItems(id, queryString)
      .then(({ data, pagination: pag }) => {
        setItems(data);
        setPagination(pag);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, search]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1>Items</h1>
      <ul className="list-group mt-3">
        {items.map((item) => (
          <li key={item.id} className="list-group-item">
            <Link to={`/categories/${id}/items/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          basePath={`/#/categories/${id}/items`}
        />
      )}
    </div>
  );
}

export default CategoryItemsIndexPage;
