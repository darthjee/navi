import { Outlet } from 'react-router-dom';
import BaseUrlsMenu from './BaseUrlsMenu.jsx';
import StatsHeader from './StatsHeader.jsx';

function Layout() {
  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center gap-3 mb-2">
        <h1 className="mb-0">Navi — Cache Warmer</h1>
        <BaseUrlsMenu />
      </div>
      <StatsHeader />
      <Outlet />
    </div>
  );
}

export default Layout;
