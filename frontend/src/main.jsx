import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Emissions from './components/pages/Emissions.jsx';
import Extractions from './components/pages/Extractions.jsx';
import Job from './components/pages/Job.jsx';
import Jobs from './components/pages/Jobs.jsx';
import Layout from './components/pages/Layout.jsx';
import LogsPage from './components/pages/LogsPage.jsx';
import MemoryStatus from './components/pages/MemoryStatus.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/logs" replace />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:status" element={<Jobs />} />
          <Route path="job/:id" element={<Job />} />
          <Route path="memory/status" element={<MemoryStatus />} />
          <Route path="emissions" element={<Emissions />} />
          <Route path="extractions" element={<Extractions />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
