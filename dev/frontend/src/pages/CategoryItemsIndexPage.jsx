import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchItems } from '../clients/ItemsClient.js';

function CategoryItemsIndexPage() {
  const { id } = useParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems(id)
      .then((data) => {
        setItems(data);
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
      <h1>Items</h1>
      <ul className="list-group mt-3">
        {items.map((item) => (
          <li key={item.id} className="list-group-item">
            <Link to={`/categories/${id}/items/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryItemsIndexPage;
