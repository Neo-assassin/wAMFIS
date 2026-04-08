import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import SummaryPanel from './components/layout/SummaryPanel';
import Dashboard from './pages/Dashboard';
import DatasetDetails from './pages/DatasetDetails';
import Summarizer from './pages/Summarizer';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';

function App() {
  const [isSummaryCollapsed, setSummaryCollapsed] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Navbar toggleSummary={() => setSummaryCollapsed(!isSummaryCollapsed)} />
        <div className="main-content-wrapper">
          <Sidebar />
          <main className="main-scrollable">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dataset/:id" element={<DatasetDetails />} />
              <Route path="/summarizer" element={<Summarizer />} />
            </Routes>
          </main>
          <SummaryPanel isCollapsed={isSummaryCollapsed} />
        </div>
      </div>
    </Router>
  );
}

export default App;
