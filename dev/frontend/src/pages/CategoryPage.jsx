import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCategory } from '../clients/CategoriesClient.js';

function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategory(id)
      .then((data) => {
        setCategory(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
      <h1>{category.name}</h1>
      <Link to={`/categories/${id}/items`} className="btn btn-primary mt-3">View Items</Link>
    </div>
  );
}

export default CategoryPage;
