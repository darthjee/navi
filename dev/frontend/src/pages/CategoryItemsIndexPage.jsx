import { useParams } from 'react-router-dom';
import { fetchItems } from '../clients/ItemsClient.js';
import PaginatedList from '../components/PaginatedList.jsx';

function CategoryItemsIndexPage() {
  const { id } = useParams();

  return (
    <PaginatedList
      title="Items"
      fetchPage={(queryString) => fetchItems(id, queryString)}
      itemPath={(item) => `/categories/${id}/items/${item.id}`}
      basePath={`/#/categories/${id}/items`}
      resourceId={id}
    />
  );
}

export default CategoryItemsIndexPage;
