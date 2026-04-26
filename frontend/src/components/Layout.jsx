import { Outlet } from 'react-router-dom';
import StatsHeader from './StatsHeader.jsx';

function Layout() {
  return (
    <div className="container mt-4">
      <h1 className="mb-4">Navi — Cache Warmer</h1>
      <StatsHeader />
      <Outlet />
    </div>
  );
}

export default Layout;
