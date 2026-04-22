import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VotingPage from './components/VotingPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<VotingPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;