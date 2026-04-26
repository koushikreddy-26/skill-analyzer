import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, LogOut, Clock, Target, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  if (!user && !token) {
    return <Navigate to="/auth" />;
  }

  // Prevent showing empty profile if user data is still loading
  if (!user && token) {
     return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar / Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1 space-y-6"
        >
          <div className="p-6 rounded-2xl bg-surface/30 border border-surface backdrop-blur-sm shadow-xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-inner mx-auto">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            <div className="text-center space-y-1 mb-8">
              <h2 className="text-xl font-bold">{user?.username}</h2>
              <p className="text-textMuted text-sm">{user?.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-sm text-textMuted">
                <Calendar className="w-4 h-4 mr-3" />
                Joined {user?.created_at}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-8 flex items-center justify-center py-2 px-4 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* History Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-3"
        >
          {/* Stats Row */}
          {!loadingHistory && history.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-surface/30 p-4 rounded-xl border border-surface shadow-md flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                <span className="text-3xl font-black text-white">{history.length}</span>
                <span className="text-[10px] font-bold tracking-wider text-textMuted uppercase mt-1 text-center">Total Scans</span>
              </div>
              <div className="bg-surface/30 p-4 rounded-xl border border-surface shadow-md flex flex-col items-center justify-center hover:border-green-400/50 transition-colors">
                <span className="text-3xl font-black text-green-400">{Math.max(...history.map(h => h.match_percentage))}%</span>
                <span className="text-[10px] font-bold tracking-wider text-textMuted uppercase mt-1 text-center">Best Match</span>
              </div>
              <div className="bg-surface/30 p-4 rounded-xl border border-surface shadow-md flex flex-col items-center justify-center hover:border-accent/50 transition-colors">
                <span className="text-3xl font-black text-accent">{Math.round(history.reduce((a, b) => a + b.match_percentage, 0) / history.length)}%</span>
                <span className="text-[10px] font-bold tracking-wider text-textMuted uppercase mt-1 text-center">Avg Score</span>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-primary" />
            Analysis History
          </h2>

          {loadingHistory ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-surface/20 rounded-2xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface/20 border border-surface border-dashed">
              <p className="text-textMuted mb-4">You haven't run any analysis yet.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-primary hover:text-accent font-medium inline-flex items-center"
              >
                Go to Dashboard <Target className="w-4 h-4 ml-1" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="p-6 rounded-2xl bg-surface/30 border border-surface hover:border-primary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg text-white group-hover:text-primary transition-colors flex items-center gap-2">
                       {record.role} <span className="text-xs font-normal px-2 py-1 bg-surface rounded-md text-textMuted">{record.created_at}</span>
                    </h3>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="flex items-center text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" /> {record.matched_count} skills matched
                      </span>
                      <span className="flex items-center text-yellow-500">
                        <XCircle className="w-4 h-4 mr-1" /> {record.missing_count} skills missing
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                      {record.match_percentage}%
                    </span>
                    <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Match Score</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
