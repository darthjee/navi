import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Job from './components/Job.jsx';
import Jobs from './components/Jobs.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:status" element={<Jobs />} />
        <Route path="/job/:id" element={<Job />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
