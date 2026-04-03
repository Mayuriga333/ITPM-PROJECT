/**
 * ProfilePage.jsx — loads the real logged-in user from authAPI
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Navbar from '../components/Navbar';

/* ── password strength ─────────────────────────────────── */
const STRENGTH_LEVELS = [
  { w: 'w-1/5',  color: '#ef4444', label: 'Very Weak'  },
  { w: 'w-2/5',  color: '#f97316', label: 'Weak'       },
  { w: 'w-3/5',  color: '#eab308', label: 'Fair'       },
  { w: 'w-4/5',  color: '#84cc16', label: 'Strong'     },
  { w: 'w-full', color: '#2dd4bf', label: 'Very Strong' },
];
function getStrengthScore(pw) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

/* ── small helpers ─────────────────────────────────────── */
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <span>⚠</span> {msg}
    </p>
  );
}
function Alert({ type, msg }) {
  if (!msg) return null;
  const cls = type === 'success'
    ? 'bg-teal-500/10 border border-teal-500/25 text-teal-300'
    : 'bg-red-500/10 border border-red-500/25 text-red-400';
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-5 ${cls}`}>
      <span>{type === 'success' ? '✓' : '!'}</span> {msg}
    </div>
  );
}

/* ── main component ────────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();

  // ── user data ──────────────────────────────────────────
  const [loadingUser, setLoadingUser] = useState(true);
  const [user,        setUser]        = useState(null);

  // ── form fields ────────────────────────────────────────
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── UI state ───────────────────────────────────────────
  const [errors,       setErrors]       = useState({});
  const [fieldOk,      setFieldOk]      = useState({});
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError,   setAlertError]   = useState('');
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [strength,     setStrength]     = useState(null);

  // savedRef tracks the last-saved values so Cancel can reset to them
  const savedRef = useRef({ name: '', email: '' });

  /* ── fetch logged-in user on mount ─────────────────── */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        const u = response.data.user;          // adjust to your API shape
        setUser(u);
        setName(u.name);
        setEmail(u.email);
        savedRef.current = { name: u.name, email: u.email };
      } catch (err) {
        setAlertError('Failed to load profile. Please refresh.');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  /* ── validation ─────────────────────────────────────── */
  function setErr(field, msg)  {
    setErrors(e  => ({ ...e,  [field]: msg   }));
    setFieldOk(o => ({ ...o,  [field]: false }));
    return false;
  }
  function clearErr(field) {
    setErrors(e  => { const n = { ...e };  delete n[field]; return n; });
    setFieldOk(o => ({ ...o, [field]: true }));
    return true;
  }
  function validateName(val = name) {
    const v = val.trim();
    if (!v)           return setErr('name', 'Full name is required.');
    if (v.length < 2) return setErr('name', 'Name must be at least 2 characters.');
    if (!/^[a-zA-Z\s''\-]+$/.test(v)) return setErr('name', 'Name can only contain letters and spaces.');
    return clearErr('name');
  }
  function validateEmail(val = email) {
    const v = val.trim();
    if (!v) return setErr('email', 'Email address is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setErr('email', 'Please enter a valid email address.');
    return clearErr('email');
  }
  function validatePassword(val = password) {
    if (!val) { clearErr('password'); return true; }
    if (val.length < 8)        return setErr('password', 'Password must be at least 8 characters.');
    if (!/[a-zA-Z]/.test(val)) return setErr('password', 'Password must include at least one letter.');
    if (!/[0-9]/.test(val))    return setErr('password', 'Password must include at least one number.');
    return clearErr('password');
  }
  function validateConfirm(pw = password, cpw = confirmPassword) {
    if (!cpw)       return setErr('confirm', 'Please confirm your password.');
    if (pw !== cpw) return setErr('confirm', 'Passwords do not match.');
    return clearErr('confirm');
  }

  function handlePasswordChange(val) {
    setPassword(val);
    if (!val) {
      setStrength(null); clearErr('password');
      setConfirmPassword(''); clearErr('confirm');
      return;
    }
    setStrength(STRENGTH_LEVELS[getStrengthScore(val)]);
    validatePassword(val);
    if (confirmPassword) validateConfirm(val, confirmPassword);
  }

  /* ── cancel — resets to last saved values ───────────── */
  function handleCancel() {
    setName(savedRef.current.name);
    setEmail(savedRef.current.email);
    setPassword(''); setConfirmPassword('');
    setStrength(null); setErrors({}); setFieldOk({});
    setAlertSuccess(''); setAlertError('');
  }

  /* ── save changes ───────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setAlertSuccess(''); setAlertError('');

    const ok = validateName() & validateEmail() & validatePassword() & (password ? validateConfirm() : true);
    if (!ok) return;

    setSaving(true);
    try {
      const updateData = { name, email };
      if (password) updateData.password = password;

      const response = await authAPI.updateProfile(updateData);
      const updatedUser = response.data.user;   // adjust to your API shape

      // keep local user state in sync
      setUser(updatedUser);
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      savedRef.current = { name: updatedUser.name, email: updatedUser.email };

      setPassword(''); setConfirmPassword('');
      setStrength(null); setFieldOk({});
      setAlertSuccess('Profile updated successfully!');
      setTimeout(() => setAlertSuccess(''), 4000);
    } catch (err) {
      setAlertError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  /* ── delete account ─────────────────────────────────── */
  async function handleDelete() {
    setDeleting(true);
    try {
      await authAPI.deleteProfile();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      setAlertError(err?.response?.data?.message || 'Failed to delete account.');
      setShowModal(false);
    } finally {
      setDeleting(false);
    }
  }

  /* ── input className helper ─────────────────────────── */
  function inputCls(field) {
    const base =
      'w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-white ' +
      'placeholder-slate-500 outline-none transition-all duration-200 focus:bg-slate-800';
    if (errors[field])  return `${base} border-red-500 ring-2 ring-red-500/20`;
    if (fieldOk[field]) return `${base} border-teal-400 ring-2 ring-teal-400/15`;
    return `${base} border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`;
  }

  const initials = name.trim().charAt(0).toUpperCase() || '?';
  const role     = user?.role || 'User';

  /* ── loading screen ─────────────────────────────────── */
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <span className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin inline-block mb-4" />
          <p className="text-sm text-slate-400">Loading your profile…</p>
        </div>
      </div>
    );
  }

  /* ── main render ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">

      {/* Animated background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full -top-48 -right-24 animate-pulse opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full -bottom-36 -left-20 opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)' }} />
      </div>

      <Navbar />

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-[1100px] mx-auto px-8 py-12 pb-20">

        {/* Page header */}
        <div className="flex items-end justify-between mb-14 pb-8 border-b border-slate-700">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-indigo-400 mb-2">
              Account Settings
            </p>
            <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight">
              {name.split(' ')[0]}{' '}
              <em className="italic text-indigo-400">{name.split(' ').slice(1).join(' ')}</em>
            </h1>
            <p className="text-sm text-slate-400 mt-3 font-light max-w-sm leading-relaxed">
              Manage your personal information, credentials and account preferences.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-3">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center font-serif text-3xl font-bold text-white transition-transform hover:scale-105 cursor-default bg-indigo-600 shadow-lg shadow-indigo-600/30">
              {initials}
            </div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase">
              <span className="text-[8px]">●</span>{role}
            </span>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* Identity card — shows live API data */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-8 py-7 shadow-lg hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-serif text-2xl font-bold text-white bg-indigo-600">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg font-semibold text-white truncate">{name}</div>
                  <div className="text-sm text-slate-400 mt-0.5 font-light truncate">{email}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase shrink-0">
                  <span className="text-[8px]">●</span>{role}
                </span>
              </div>

              {/* Stats — replace hardcoded values with user fields if your API returns them */}
              <div className="mt-6 grid grid-cols-3 rounded-xl overflow-hidden gap-px bg-slate-700">
                {[
                  { v: user?.courses  ?? '—', l: 'Courses',    c: '#818cf8' },
                  { v: user?.completion != null ? `${user.completion}%` : '—', l: 'Completion', c: '#818cf8' },
                  { v: user?.gpa      ?? '—', l: 'GPA',        c: '#4ade80' },
                ].map(s => (
                  <div key={s.l} className="bg-slate-900 py-4 text-center hover:bg-slate-800/80 transition-colors">
                    <div className="font-serif text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit profile form */}
            <div className="bg-[#1a2238] border border-[#252f47] rounded-2xl p-8 shadow-[0_4px_32px_rgba(0,0,0,0.5)] hover:border-violet-500/25 transition-colors">

              <div className="flex items-center gap-4 mb-7 pb-5 border-b border-[#252f47]">
                <div className="w-10 h-10 rounded-lg bg-violet-500/[0.14] border border-violet-500/20 flex items-center justify-center text-base shrink-0">✦</div>
                <div>
                  <div className="font-serif text-lg font-semibold text-[#e8eaf6]">Edit Profile</div>
                  <div className="text-xs text-[#8892b0] mt-0.5 font-light">Update your personal information below</div>
                </div>
              </div>

              <Alert type="success" msg={alertSuccess} />
              <Alert type="error"   msg={alertError}   />

              <form onSubmit={handleSubmit} noValidate>

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label htmlFor="pp-name" className="block text-[10px] font-semibold tracking-widest uppercase text-[#8892b0] mb-2">Full Name</label>
                    <input id="pp-name" type="text" className={inputCls('name')} value={name}
                      placeholder="Enter your full name"
                      onChange={e => setName(e.target.value)}
                      onBlur={() => validateName()} />
                    <FieldError msg={errors.name} />
                  </div>
                  <div>
                    <label htmlFor="pp-email" className="block text-[10px] font-semibold tracking-widest uppercase text-[#8892b0] mb-2">Email Address</label>
                    <input id="pp-email" type="email" className={inputCls('email')} value={email}
                      placeholder="your.email@example.com"
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => validateEmail()} />
                    <FieldError msg={errors.email} />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6 text-[10px] tracking-widest uppercase text-slate-500">
                  <div className="flex-1 h-px bg-slate-700" />
                  Change Password
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                  <div>
                    <label htmlFor="pp-pw" className="block text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">New Password</label>
                    <input id="pp-pw" type="password" className={inputCls('password')} value={password}
                      placeholder="Leave blank to keep current"
                      onChange={e => handlePasswordChange(e.target.value)}
                      onBlur={() => validatePassword()} />
                    {strength && (
                      <div className="mt-2">
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-1.5">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.w}`} style={{ background: strength.color }} />
                        </div>
                        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                    )}
                    <FieldError msg={errors.password} />
                  </div>
                  {password && (
                    <div>
                      <label htmlFor="pp-cpw" className="block text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">Confirm Password</label>
                      <input id="pp-cpw" type="password" className={inputCls('confirm')} value={confirmPassword}
                        placeholder="Re-enter new password"
                        onChange={e => { setConfirmPassword(e.target.value); validateConfirm(password, e.target.value); }}
                        onBlur={() => validateConfirm()} />
                      <FieldError msg={errors.confirm} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-light mb-6">Use 8+ characters with a mix of letters and numbers.</p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button type="submit" disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-semibold tracking-widest uppercase text-white transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed hover:-translate-y-px active:translate-y-0 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">
                    {saving
                      ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" /> Saving…</>
                      : 'Save Changes'}
                  </button>
                  <button type="button" onClick={handleCancel} disabled={saving}
                    className="flex-1 py-3 px-5 rounded-xl text-xs font-semibold tracking-widest uppercase text-slate-400 border border-slate-700 bg-transparent hover:bg-slate-700/50 hover:text-white transition-all duration-200 disabled:opacity-45 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-6">

            {/* Quick links */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-7 py-5 shadow-lg">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-4">Quick Links</p>
              {['Notification Settings', 'Privacy & Security', 'Billing & Plan', 'Connected Accounts'].map((l, i, arr) => (
                <div key={l} className={`flex items-center justify-between py-2.5 cursor-pointer group ${i < arr.length - 1 ? 'border-b border-slate-700' : ''}`}>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">{l}</span>
                  <span className="text-xs text-slate-500">→</span>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-7 shadow-lg hover:border-red-500/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg mb-4">⚠</div>
              <div className="font-serif text-[1.05rem] font-semibold text-white mb-2">Danger Zone</div>
              <p className="text-xs text-slate-400 font-light leading-relaxed mb-5">
                Permanently delete your account and all associated data. This action is irreversible.
              </p>
              <ul className="mb-5 flex flex-col gap-2">
                {['All course progress will be lost', 'Your grades and records will be removed', 'You will be signed out immediately'].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-slate-500 font-light leading-snug">
                    <span className="text-red-500 mt-px text-[10px] shrink-0">→</span>{item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowModal(true)}
                className="w-full py-3 px-6 rounded-xl text-xs font-semibold tracking-widest uppercase text-red-400 border border-red-500/30 bg-transparent hover:bg-red-500/10 hover:border-red-500 transition-all duration-200">
                Delete Account
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* ── DELETE MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-9 max-w-[440px] w-full shadow-2xl">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg mb-4">⚠</div>
            <h3 className="font-serif text-[1.3rem] font-bold text-white mb-3">Delete your account?</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed mb-7">
              This will permanently erase your profile, course history, grades and all personal data
              from our servers. There is absolutely no way to recover it after confirmation.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-semibold tracking-widest uppercase text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-55 disabled:cursor-not-allowed shadow-lg shadow-red-500/20">
                {deleting
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" /> Deleting…</>
                  : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowModal(false)} disabled={deleting}
                className="flex-1 py-3 px-6 rounded-xl text-xs font-semibold tracking-widest uppercase text-slate-300 bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:text-white transition-all disabled:opacity-45 disabled:cursor-not-allowed">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}