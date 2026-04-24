import { Link } from 'react-router-dom';

function IndexPage() {
  return (
    <div className="container mt-5">
      <h1>Welcome to the Dev App</h1>
      <p className="lead">Browse categories and items.</p>
      <Link to="/categories" className="btn btn-primary">View Categories</Link>
    </div>
  );
}

export default IndexPage;
