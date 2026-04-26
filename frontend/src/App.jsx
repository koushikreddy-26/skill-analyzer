import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';

function Navigation() {
  const { token } = useAuth();
  return (
    <nav className="border-b border-surface/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg">
            SA
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-textMuted">
            SkillAnalyzer
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <a href="https://github.com/koushikreddy-26/skill-analyzer" target="_blank" rel="noreferrer" className="text-sm font-medium text-textMuted hover:text-white transition-colors">
            GitHub
          </a>
          {token ? (
            <Link to="/profile" className="text-sm font-medium px-4 py-2 bg-surface border border-white/5 rounded-xl hover:bg-surface/80 transition-colors shadow-sm">
              Profile
            </Link>
          ) : (
            <Link to="/auth" className="text-sm font-bold flex items-center px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-textMain selection:bg-primary/30">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
