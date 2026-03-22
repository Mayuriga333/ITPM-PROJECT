import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [activeRole, setActiveRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const ROLES = ['Student', 'Volunteer', 'Admin'];

  // Password validation checks for the visual UI (mirrors native template logic)
  const isLengthValid = password.length >= 8;
  const hasUpperAndNumber = /[A-Z]/.test(password) && /[0-9]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        role: activeRole,
      });

      if (response.data.success) {
        // Save session locally
        login(response.data.data);

        // Redirect based on role
        if (response.data.data.role === 'Student') {
          navigate('/discovery');
        } else if (response.data.data.role === 'Volunteer') {
          navigate('/volunteer/dashboard');
        } else {
          // If Admin was chosen and returned success
          navigate('/admin');
        }
      } else {
        setError(response.data.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-50 bg-[#020617] bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b_0%,#020617_100%)] font-sans">
      <main className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-md w-full"
        >
          {/* Branding Header */}
          <div className="text-center mb-10">
            <h1 className="font-black text-4xl text-white tracking-tighter mb-2" style={{ fontFamily: '"Manrope", sans-serif' }}>
              EduConnect
            </h1>
            <p className="text-slate-400 text-sm">Curated Academic Excellence</p>
          </div>

          {/* Login Card: Glassmorphic surface */}
          <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 md:p-10 rounded-2xl">
            
            {/* Role Selection Segment Control */}
            <div className="flex p-1 bg-black/20 rounded-lg mb-8" role="tablist">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    setError('');
                  }}
                  className={`flex-1 py-2 text-sm rounded-md transition-all duration-200 ${
                    activeRole === role
                      ? 'bg-white/10 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white font-medium'
                  }`}
                  role="tab"
                  type="button"
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Error Alert Box */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg flex items-start gap-3 border border-red-500/20"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{error}</div>
              </motion.div>
            )}

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    required
                    className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full bg-black/20 border border-white/5 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Dynamic Password Validation UI */}
                {password.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className={`text-[10px] flex items-center gap-1.5 ${isLengthValid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isLengthValid ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      8+ characters required
                    </p>
                    <p className={`text-[10px] flex items-center gap-1.5 ${hasUpperAndNumber ? 'text-slate-400' : 'text-slate-500'}`}>
                      {hasUpperAndNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      Must include 1 uppercase letter & 1 number
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-600/20 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In as {activeRole}</span>
                )}
              </button>
            </form>

            {/* Action Links */}
            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4 text-center">
              <a href="#" className="text-sm font-medium text-indigo-500 hover:text-white transition-colors">
                Forgot Password?
              </a>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/5 w-full mt-auto py-12">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-6">
          <div className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: '"Manrope", sans-serif' }}>EduConnect</div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 items-center">
            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors text-sm font-medium">Forgot Password</a>
            <Link to="/register" className="text-indigo-500 hover:text-white underline text-sm font-semibold">Sign Up</Link>
            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors text-sm font-medium">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors text-sm font-medium">Terms of Service</a>
          </div>
          <p className="text-sm text-slate-400">© 2024 EduConnect. Curated Academic Excellence.</p>
        </div>
      </footer>
    </div>
  );
}