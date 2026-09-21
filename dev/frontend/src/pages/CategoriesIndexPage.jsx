import { fetchCategories } from '../clients/CategoriesClient.js';
import PaginatedList from '../components/PaginatedList.jsx';

function CategoriesIndexPage() {
  return (
    <PaginatedList
      title="Categories"
      fetchPage={fetchCategories}
      itemPath={(cat) => `/categories/${cat.id}`}
      basePath="/#/categories"
    />
  );
}

export default CategoriesIndexPage;
