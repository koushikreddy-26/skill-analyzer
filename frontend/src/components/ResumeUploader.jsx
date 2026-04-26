import { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResumeUploader({ onFileSelect, onRoleSelect, roles, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type === "application/pdf") {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    onRoleSelect(e.target.value);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-textMuted ml-1">Target Role</label>
        <input 
          type="text"
          list="roles-list"
          value={selectedRole}
          onChange={handleRoleChange}
          placeholder="e.g. Data Scientist, UX Designer"
          className="w-full bg-surface border border-surface rounded-xl px-4 py-3.5 text-textMain focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
        />
        <datalist id="roles-list">
          {roles.map(r => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-textMuted ml-1">Resume (PDF)</label>
        <div 
          className={`relative w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
            dragActive ? 'border-primary bg-primary/10' : 
            selectedFile ? 'border-green-500 bg-green-500/5' : 
            'border-surface hover:border-textMuted/50 hover:bg-surface/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept=".pdf" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            disabled={isLoading}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center px-4"
          >
            {selectedFile ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                <p className="font-semibold text-green-400">{selectedFile.name}</p>
                <p className="text-xs text-textMuted mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-surface/80 border border-white/5 flex items-center justify-center mb-3 shadow-lg">
                  <UploadCloud className="w-7 h-7 text-primary" />
                </div>
                <p className="font-medium text-textMain text-lg">Click to upload or drag & drop</p>
                <p className="text-sm text-textMuted mt-1">PDF format (max. 5MB)</p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
