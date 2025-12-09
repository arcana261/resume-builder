import { Routes, Route } from 'react-router-dom';
import { JobBrowser } from './pages/JobBrowser';
import { JobDetailPage } from './pages/JobDetailPage';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<JobBrowser />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
