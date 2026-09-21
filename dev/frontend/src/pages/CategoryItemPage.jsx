import { useParams } from 'react-router-dom';
import { fetchItem } from '../clients/ItemsClient.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useFetchData from '../hooks/useFetchData.js';

function CategoryItemPage() {
  const { categoryId, id } = useParams();
  const { data: item, error, loading } = useFetchData(() => fetchItem(categoryId, id), [categoryId, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="container mt-4">
      <h1>{item.name}</h1>
    </div>
  );
}

export default CategoryItemPage;
