import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Job from './components/Job.jsx';
import Jobs from './components/Jobs.jsx';
import Layout from './components/Layout.jsx';
import LogsPage from './components/LogsPage.jsx';

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
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
