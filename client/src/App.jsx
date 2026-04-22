import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import VotingPage from './components/VotingPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function Header() {
  const location = useLocation();
  return (
    <header>
      <div className="header-logo">
        <img src="https://via.placeholder.com/150x60?text=Alcaldía+Soledad" alt="Alcaldía de Soledad" />
      </div>
      <nav>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Votación</Link>
        <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link>
      </nav>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="bg-canvas"></div>
      <div className="grid-overlay"></div>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<VotingPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      <footer>
        <img src="https://via.placeholder.com/120x40?text=Alcaldía" alt="Alcaldía de Soledad" />
        <div className="motto">“Compromiso con la participación ciudadana”</div>
        <p>© 2026 Alcaldía de Soledad - Sistema de Votación Institucional</p>
        <hr />
        <p>Plataforma segura de sufragio electrónico</p>
      </footer>
    </Router>
  );
}

export default App;