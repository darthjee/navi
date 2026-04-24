import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchItem } from '../clients/ItemsClient.js';

function CategoryItemPage() {
  const { categoryId, id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem(categoryId, id)
      .then((data) => {
        setItem(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId, id]);

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
      <h1>{item.name}</h1>
    </div>
  );
}

export default CategoryItemPage;
