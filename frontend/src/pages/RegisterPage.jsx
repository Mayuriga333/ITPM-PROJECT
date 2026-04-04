/**
 * pages/RegisterPage.jsx — New user registration
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, MessageCircle, Star, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Circle, GraduationCap, HeartHandshake, AlertTriangle, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Name can only contain letters and spaces';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password || password.length === 0) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (password.length > 50) {
      return 'Password must be less than 50 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear and validate field
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
    
    // Clear general error
    if (error) setError('');
  };

  const selectRole = (role) => setForm((prev) => ({ ...prev, role }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password)
    };
    
    setFieldErrors(errors);
    
    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setError('Please fix all errors before submitting');
      return;
    }

    const result = await register(form);
    if (result.success) {
      if (result.role === 'Volunteer' && result.status === 'Pending') {
        navigate('/pending');
      } else if (result.role === 'Student') {
        navigate('/student');
      } else {
        navigate('/volunteer');
      }
    } else {
      // Handle specific server errors
      if (result.message && result.message.includes('already registered')) {
        setFieldErrors((prev) => ({ ...prev, email: 'Email is already registered' }));
        setError('This email is already in use');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 grid grid-cols-1 md:grid-cols-2 overflow-hidden">

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 items-center justify-center p-16 border-r border-slate-700 hidden md:flex">
        <div className="relative z-10 w-full max-w-sm">

          <div className="flex items-center gap-3 mb-10 hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
              <HeartHandshake size={22} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">Educonnect</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">Connect.<br />Learn.<br />Grow.</h1>
          <p className="text-base font-medium text-slate-400 leading-relaxed mb-10">
            Join our platform where students find expert volunteer tutors through intelligent matching.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300"><Bot size={20} className="text-indigo-400" /> AI-powered volunteer matching</div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300"><MessageCircle size={20} className="text-indigo-400" /> Smart chatbot assistant</div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300"><Star size={20} className="text-amber-400" /> Rated & moderated tutors</div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300"><ShieldCheck size={20} className="text-emerald-400" /> Admin-verified volunteers</div>
          </div>
        </div>

        <div className="absolute w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-10 -top-24 -right-24 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-10 -bottom-12 -left-12 pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

      {/* ── Right form ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-center p-10 sm:p-16 bg-slate-900 overflow-y-auto max-h-screen relative">
        {/* Mobile bg decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10 md:hidden" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl md:hidden" />
        
        <form className="w-full max-w-md flex flex-col gap-5 animate-fadeIn relative z-10" onSubmit={handleSubmit}>

          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-sm font-medium text-slate-400 mb-6">
            Already have one? <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition-colors">Sign in</Link>
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm font-medium text-red-500 flex items-start gap-3 animate-fadeIn">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-xs font-bold text-slate-300 uppercase tracking-widest">Full Name</label>
            <input
              id="name"
              name="name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
              className={`bg-slate-900/50 border ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'} rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner`}
            />
            {fieldErrors.name && <span className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1.5 animate-fadeIn"><AlertCircle size={14} /> {fieldErrors.name}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reg-email" className="text-xs font-bold text-slate-300 uppercase tracking-widest">Email Address</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={`bg-slate-900/50 border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'} rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner`}
            />
            {fieldErrors.email && <span className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1.5 animate-fadeIn"><AlertCircle size={14} /> {fieldErrors.email}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reg-password" className="text-xs font-bold text-slate-300 uppercase tracking-widest">Password</label>
            <div className="relative flex items-center w-full">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className={`flex-1 bg-slate-900/50 border ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'} rounded-xl px-4 py-3 pr-12 text-sm font-medium text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner`}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <span className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1.5 animate-fadeIn"><AlertCircle size={14} /> {fieldErrors.password}</span>}
            <div className="mt-2 p-3 bg-slate-800/80 border border-slate-700 rounded-xl shadow-inner">
              <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">Password must contain:</p>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                <li className={`flex items-center gap-2 text-xs font-medium transition-colors duration-200 ${form.password && form.password.length >= 6 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {form.password && form.password.length >= 6 ? <CheckCircle2 size={14} /> : <Circle size={14} />} At least 6 characters
                </li>
                <li className={`flex items-center gap-2 text-xs font-medium transition-colors duration-200 ${form.password && /(?=.*[a-z])/.test(form.password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {form.password && /(?=.*[a-z])/.test(form.password) ? <CheckCircle2 size={14} /> : <Circle size={14} />} One lowercase letter
                </li>
                <li className={`flex items-center gap-2 text-xs font-medium transition-colors duration-200 ${form.password && /(?=.*[A-Z])/.test(form.password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {form.password && /(?=.*[A-Z])/.test(form.password) ? <CheckCircle2 size={14} /> : <Circle size={14} />} One uppercase letter
                </li>
                <li className={`flex items-center gap-2 text-xs font-medium transition-colors duration-200 ${form.password && /(?=.*\d)/.test(form.password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {form.password && /(?=.*\d)/.test(form.password) ? <CheckCircle2 size={14} /> : <Circle size={14} />} One number
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-center gap-2 py-4 px-2 bg-slate-800 border ${form.role === 'Student' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/50' : 'border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:border-slate-500'} rounded-xl cursor-pointer transition-all duration-200 text-center hover:-translate-y-1 shadow-sm`}
                onClick={() => selectRole('Student')}
              >
                <input type="radio" name="role" value="Student" checked={form.role === 'Student'} onChange={() => {}} className="hidden" />
                <GraduationCap size={32} />
                <span className="text-sm font-bold text-white">Student</span>
              </label>
              <label
                className={`flex flex-col items-center gap-2 py-4 px-2 bg-slate-800 border ${form.role === 'Volunteer' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/50' : 'border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:border-slate-500'} rounded-xl cursor-pointer transition-all duration-200 text-center hover:-translate-y-1 shadow-sm`}
                onClick={() => selectRole('Volunteer')}
              >
                <input type="radio" name="role" value="Volunteer" checked={form.role === 'Volunteer'} onChange={() => {}} className="hidden" />
                <Handshake size={32} />
                <span className="text-sm font-bold text-white">Volunteer</span>
              </label>
            </div>
            {form.role === 'Volunteer' && (
              <p className="text-xs font-medium text-amber-500 mt-2 leading-relaxed flex items-start gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                Volunteer accounts require admin approval before you can access the platform.
              </p>
            )}
          </div>

          <button className="mt-2 px-5 py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 border-none inline-flex items-center justify-center gap-2 tracking-wide w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" type="submit" disabled={loading}>
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={18} />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;