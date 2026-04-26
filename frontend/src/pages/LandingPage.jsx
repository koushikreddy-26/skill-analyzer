import { ArrowRight, UploadCloud, Target, TrendingUp, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] px-4 py-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="max-w-4xl text-center space-y-8"
      >
        <div className="inline-flex items-center space-x-2 bg-surface/50 rounded-full px-4 py-2 border border-surface text-sm font-medium text-primary mb-4 shadow-sm">
          <TrendingUp className="w-4 h-4" />
          <span>AI-Powered Job Market Analysis</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Analyze <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Skill Gaps</span> Between You & Industry
        </h1>
        
        <p className="text-xl text-textMuted max-w-2xl mx-auto leading-relaxed">
          Upload your resume and select your target role. Our analyzer cross-references your current skills with market demands to give you a personalized learning roadmap.
        </p>

        <div className="flex justify-center pt-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-primary font-pj rounded-xl hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
          >
            Start Analysis
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full mt-32 pb-20">
        {[
          { icon: <UploadCloud className="w-8 h-8 text-primary" />, title: 'Smart Resume Parsing', desc: 'Automatically extract your skills and technologies using our python extraction engine.' },
          { icon: <Target className="w-8 h-8 text-accent" />, title: 'Role-Based Targeting', desc: 'Compare your profile against standard technical requirements for modern tech roles.' },
          { icon: <BarChart2 className="w-8 h-8 text-pink-500" />, title: 'Gap Visualization', desc: 'Beautiful charts and metrics to help visualize what you know and what to learn next.' }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + (i * 0.1) }}
            className="p-6 rounded-2xl bg-surface/30 border border-surface backdrop-blur-sm hover:border-surface/80 transition-colors shadow-xl shadow-black/10"
          >
            <div className="mb-4 bg-surface w-14 h-14 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-textMuted leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
