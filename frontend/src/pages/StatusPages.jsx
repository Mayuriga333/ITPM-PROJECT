/**
 * pages/StatusPages.jsx — Screens shown to users whose accounts are
 *   Pending / Suspended / Rejected (cannot access main dashboards)
 */

import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';

const StatusLayout = ({ icon, title, subtitle, color, children }) => (
  <div className="min-h-screen flex items-center justify-center p-8 bg-slate-900 relative overflow-hidden">
    <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 relative z-10" style={{ '--status-color': color }}>
      <div className="text-6xl mb-6 text-center" style={{ color: 'var(--status-color)' }}>{icon}</div>
      <h1 className="text-2xl font-bold text-white mb-3 text-center"><span className="text-2xl font-extrabold text-white tracking-tight">Educonnect</span>{title}</h1>
      <p className="text-slate-400 text-center mb-6">{subtitle}</p>
      {children}
    </div>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: color }}>
      <div className="w-96 h-96 rounded-full opacity-20 blur-3xl"></div>
    </div>
  </div>
);

/* ── Pending ─────────────────────────────────────────────────────────────────── */
export const PendingPage = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  return (
    <StatusLayout
      icon="⏳"
      title="Awaiting Approval"
      subtitle="Your account is currently under review by our admin team. You'll have full access once approved."
      color="rgba(251,191,36,.6)"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
          <span className="brand-name tracking-tight">Educonnect</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-amber-500/50">2</div>
          <span className="text-white font-medium">Admin review in progress</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
          <span className="text-slate-400">Access granted</span>
        </div>
      </div>
      <p className="text-slate-400 text-sm text-center">This typically takes 1–2 business days.</p>
      <button className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium" onClick={() => { logout(); navigate('/login'); }}>
        Sign Out
      </button>
    </StatusLayout>
  );
};

/* ── Suspended ───────────────────────────────────────────────────────────────── */
export const SuspendedPage = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  return (
    <StatusLayout
      icon="🚫"
      title="Account Suspended"
      subtitle="Your account has been temporarily suspended by a platform administrator."
      color="rgba(255,101,132,.6)"
    >
      {user?.statusReason && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <strong className="text-red-400">Reason:</strong> {user.statusReason}
        </div>
      )}
      <p className="text-slate-400 text-sm mb-6">
        If you believe this is a mistake, please contact{' '}
        <a href="mailto:support@educonnect.com" className="text-indigo-400 hover:text-indigo-300 underline">support@educonnect.com</a>
        .
      </p>
      <button className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium" onClick={() => { logout(); navigate('/login'); }}>
        Sign Out
      </button>
    </StatusLayout>
  );
};

/* ── Rejected ────────────────────────────────────────────────────────────────── */
export const RejectedPage = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  return (
    <StatusLayout
      icon="❌"
      title="Application Rejected"
      subtitle="Unfortunately, your application was not approved at this time."
      color="rgba(239,68,68,.6)"
    >
      {user?.statusReason && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <strong className="text-red-400">Reason:</strong> {user.statusReason}
        </div>
      )}
      <p className="text-slate-400 text-sm mb-6">
        You may re-apply with updated credentials or contact{' '}
        <a href="mailto:support@educonnect.com" className="text-indigo-400 hover:text-indigo-300 underline">support@educonnect.com</a>
        .
      </p>
      <button className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium" onClick={() => { logout(); navigate('/login'); }}>
        Sign Out
      </button>
    </StatusLayout>
  );
};