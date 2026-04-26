import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, CheckCircle, ChevronRight, BookOpen, AlertTriangle, Clock, Target } from 'lucide-react';
import ResumeUploader from '../components/ResumeUploader';
import { useAuth } from '../context/AuthContext';

import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true });
      return;
    }
    axios.get(`${API_URL}/roles`).then(res => setRoles(res.data.roles)).catch(console.error);
  }, [token, navigate]);

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedRole) return;
    
    setIsLoading(true);
    setResults(null);
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('role', selectedRole);
    
    try {
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      };
      const res = await axios.post(`${API_URL}/upload`, formData, config);
      setResults(res.data);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Analysis failed. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreData = results ? [
    { name: 'Matched', value: results.match_percentage },
    { name: 'Gap', value: 100 - results.match_percentage }
  ] : [];

  const COLORS = ['#10b981', '#334155'];

  return (
    <div className="min-h-[calc(100vh-73px)] p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar Layout */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Upload Section */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surface shadow-xl shadow-black/10 backdrop-blur-sm h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">01</span>
              Setup Analysis
            </h2>
            <ResumeUploader 
              roles={roles} 
              onFileSelect={setSelectedFile} 
              onRoleSelect={setSelectedRole} 
              isLoading={isLoading} 
            />
            <button 
              onClick={handleAnalyze}
              disabled={!selectedFile || !selectedRole || isLoading}
              className="w-full mt-8 flex items-center justify-center py-4 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run AI Gap Analysis"}
            </button>
          </div>
        </div>

        {/* Results Overview */}
        <div className="lg:col-span-2 min-h-[500px]">
          <AnimatePresence mode="wait">
            {!results && !isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-textMuted border-2 border-dashed border-surface rounded-2xl bg-surface/10 p-12 text-center"
              >
                <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <div className="w-12 h-12 border-4 border-t-primary border-r-accent border-b-primary/30 border-l-transparent rounded-full animate-spin duration-1000" />
                </div>
                <h3 className="text-2xl font-bold text-textMain mb-3">Awaiting AI Data</h3>
                <p className="max-w-sm leading-relaxed">Upload a text-based resume and select a role to dynamically generate your gap analysis using real-time LLM parsing.</p>
              </motion.div>
            )}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center bg-surface/40 rounded-2xl border border-surface shadow-2xl"
              >
                <Loader2 className="w-14 h-14 text-primary animate-spin mb-6" />
                <p className="animate-pulse text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Groq AI is analyzing semantics & extracting skills...</p>
              </motion.div>
            )}

            {results && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-2xl bg-gradient-to-br from-surface to-surface/50 border border-surface backdrop-blur flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Score Donut */}
                  <div className="relative w-52 h-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scoreData}
                          innerRadius={75}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="transparent"
                          cornerRadius={8}
                        >
                          {scoreData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid currentColor', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600">{Math.round(results.match_percentage)}%</span>
                      <span className="text-xs font-bold text-textMuted tracking-widest uppercase mt-1">Match Score</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left z-10">
                    <div className="inline-flex items-center space-x-2 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                      <CheckCircle className="w-3 h-3" />
                      <span>Analysis Saved to Database</span>
                    </div>
                    <h3 className="text-4xl font-extrabold tracking-tight mb-4">Profile Evaluation</h3>
                    <p className="text-textMuted text-lg leading-relaxed">
                      AI identified <span className="text-white font-bold">{results.matched_skills.length}</span> matching skills. 
                      You have a <span className="text-white font-bold">{results.missing_skills.length} skill gap</span> compared to industry-standard requirements for <span className="text-primary font-semibold">{selectedRole}</span>.
                    </p>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Matched */}
                  <div className="p-6 rounded-2xl bg-surface/40 border border-surface shadow-xl">
                    <h4 className="flex items-center text-xl font-bold text-green-400 mb-6 border-b border-white/5 pb-4">
                      <CheckCircle className="w-6 h-6 mr-3" /> Verified by AI
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {results.matched_skills.length > 0 ? results.matched_skills.map(s => (
                        <span key={s} className="px-3.5 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm font-semibold capitalize tracking-wide">{s}</span>
                      )) : <span className="text-textMuted text-sm font-medium">No strict technical matches found by LLM.</span>}
                    </div>
                  </div>

                  {/* Missing */}
                  <div className="p-6 rounded-2xl bg-surface/40 border border-surface shadow-xl">
                    <h4 className="flex items-center text-xl font-bold text-rose-400 mb-6 border-b border-white/5 pb-4">
                      <AlertTriangle className="w-6 h-6 mr-3" /> Skill Gaps Identified
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {results.missing_skills.length > 0 ? results.missing_skills.map(s => (
                        <span key={s} className="px-3.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-semibold capitalize tracking-wide">{s}</span>
                      )) : <span className="text-textMuted text-sm font-medium">You have all the required skills!</span>}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="p-8 rounded-2xl bg-surface/60 border border-surface shadow-2xl relative overflow-hidden">
                     <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
                    <h4 className="flex items-center text-2xl font-bold mb-8 relative z-10">
                      <BookOpen className="w-7 h-7 mr-3 text-accent" /> AI Learning Path
                    </h4>
                    <div className="grid gap-4 relative z-10">
                      {results.recommendations.map((rec, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-background border border-white/5 hover:border-accent/50 hover:bg-accent/5 transition-all group shadow-sm">
                          <div>
                            <div className="flex items-center">
                              <span className="font-extrabold text-white capitalize text-lg">{rec.skill}</span>
                              <span className="text-[10px] ml-4 px-2 py-0.5 bg-accent/20 text-accent border border-accent/20 rounded uppercase font-black tracking-widest">{rec.type}</span>
                            </div>
                          </div>
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(rec.resource + ' course tutorial')}`} target="_blank" rel="noreferrer" className="flex items-center text-accent/80 font-bold mt-3 sm:mt-0 opacity-80 group-hover:opacity-100 group-hover:text-accent transition-all hover:underline">
                            {rec.resource}
                            <ChevronRight className="w-5 h-5 ml-1 mt-0.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
