import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Hourglass, LogIn, X } from 'lucide-react';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    // setError(null);
    
    // Validate all fields
    const errors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password)
    };
    
    setFieldErrors(errors);
    
    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setError({ type: 'error', text: 'Please fix all errors before signing in' });
      return;
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      const map = { Student: '/student', Volunteer: '/volunteer', Admin: '/admin' };
      navigate(map[result.role] || '/');
    } else {
      // Handle specific server errors
      if (result.message && result.message.includes('Invalid email or password')) {
        setFieldErrors((prev) => ({ 
          ...prev, 
          email: 'Invalid email or password',
          password: 'Invalid email or password'
        }));
        setError({ type: 'error', text: 'Invalid email or password' });
      } else if (result.message && result.message.includes('not found')) {
        setFieldErrors((prev) => ({ 
          ...prev, 
          email: 'User not found'
        }));
        setError({ type: 'error', text: 'No account found with this email' });
      } else if (result.message && result.message.includes('suspended')) {
        setError({ type: 'error', text: 'Your account has been suspended. Please contact support.' });
      } else if (result.message && result.message.includes('rejected')) {
        setError({ type: 'error', text: 'Your account application was rejected. Please contact support.' });
      } else if (result.message && result.message.includes('pending')) {
        setError({ type: 'warning', text: 'Your account is pending admin approval. Please check back later.' });
      } else {
        setError({ type: 'error', text: result.message || 'Login failed. Please try again.' });
        console.log('Error set:', result.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="page">
      <div className="min-h-screen bg-slate-900 grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* ── Left panel ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 items-center justify-center p-16 border-r border-slate-700 hidden md:flex">
          <div className="relative z-10 w-full max-w-sm">

            <div className="flex items-center gap-3 mb-8 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-lg shadow-indigo-500/30">
                EC
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">Educonnect</span>
            </div>

            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">Welcome Back</h1>
            <p className="text-base text-slate-400 font-medium leading-relaxed mb-10">
              Sign in to continue connecting students with expert volunteer tutors.
            </p>

            <div className="flex gap-8">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold text-indigo-400">500+</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Volunteers</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold text-purple-400">2k+</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Students</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold text-emerald-400">4.8</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Rating</span>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        </div>

        {/* ── Right panel (form) ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-center p-8 bg-slate-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 w-full max-w-md">
            {error && (
              <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
                error.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}>
                {error.type === 'warning' ? <Hourglass className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
                <span className="flex-1">{error.text}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="glass-card fade-up p-8 sm:p-10 shadow-2xl shadow-indigo-500/10">
              <h2 className="text-3xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">Sign In</h2>
              <p className="text-sm font-medium text-slate-400 mb-8">
                New here? <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Create an account</Link>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className={`w-full bg-slate-900/50 border ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'} rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner`}
                  />
                  {fieldErrors.email && <span className="text-xs font-semibold text-red-500 mt-2 flex items-center gap-1.5 fade-in"><AlertCircle size={14} /> {fieldErrors.email}</span>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      className={`w-full pr-12 bg-slate-900/50 border ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700'} rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner`}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="text-xs font-semibold text-red-500 mt-2 flex items-center gap-1.5 fade-in"><AlertCircle size={14} /> {fieldErrors.password}</span>}
                </div>

                <div className="pt-2">
                  <button className="w-full px-5 py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2 tracking-wide bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" type="submit" disabled={loading}>
                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn size={18} />}
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;