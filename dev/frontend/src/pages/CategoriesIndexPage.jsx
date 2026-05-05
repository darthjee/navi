import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCategories } from '../clients/CategoriesClient.js';
import Pagination from '../components/Pagination.jsx';

function CategoriesIndexPage() {
  const [categories, setCategories] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();

  useEffect(() => {
    const queryString = search ? search.slice(1) : '';

    setLoading(true);
    fetchCategories(queryString)
      .then(({ data, pagination: pag }) => {
        setCategories(data);
        setPagination(pag);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search]);

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
      <h1>Categories</h1>
      <ul className="list-group mt-3">
        {categories.map((cat) => (
          <li key={cat.id} className="list-group-item">
            <Link to={`/categories/${cat.id}`}>{cat.name}</Link>
          </li>
        ))}
      </ul>
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          basePath="/#/categories"
        />
      )}
    </div>
  );
}

export default CategoriesIndexPage;
