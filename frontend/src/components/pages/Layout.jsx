import { Outlet } from 'react-router-dom';
import EngineControls from '../elements/EngineControls.jsx';
import LinksMenu from '../elements/LinksMenu.jsx';
import StatsHeader from '../elements/StatsHeader.jsx';

function Layout() {
  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center gap-3 mb-2">
        <h1 className="mb-0">Navi — Cache Warmer</h1>
        <LinksMenu />
      </div>
      <StatsHeader />
      <div className="mb-3">
        <EngineControls />
      </div>
      <Outlet />
    </div>
  );
}

export default Layout;
