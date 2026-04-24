import { Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import CategoriesIndexPage from './pages/CategoriesIndexPage.jsx';
import CategoryItemPage from './pages/CategoryItemPage.jsx';
import CategoryItemsIndexPage from './pages/CategoryItemsIndexPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import IndexPage from './pages/IndexPage.jsx';
import './styles/main.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/categories" element={<CategoriesIndexPage />} />
        <Route path="/categories/:id" element={<CategoryPage />} />
        <Route path="/categories/:id/items" element={<CategoryItemsIndexPage />} />
        <Route path="/categories/:categoryId/items/:id" element={<CategoryItemPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
