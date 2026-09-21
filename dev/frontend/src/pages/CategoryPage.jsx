import { Link, useParams } from 'react-router-dom';
import { fetchCategory } from '../clients/CategoriesClient.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useFetchData from '../hooks/useFetchData.js';

function CategoryPage() {
  const { id } = useParams();
  const { data: category, error, loading } = useFetchData(() => fetchCategory(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="container mt-4">
      <h1>{category.name}</h1>
      <Link to={`/categories/${id}/items`} className="btn btn-primary mt-3">View Items</Link>
    </div>
  );
}

export default CategoryPage;
