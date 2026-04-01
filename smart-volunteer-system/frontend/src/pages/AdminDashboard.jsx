/**
 * pages/AdminDashboard.jsx — Admin overview with platform statistics
 */

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { adminAPI }            from '../services/api';
import Navbar                  from '../components/Navbar';
import { 
  Users, GraduationCap, Handshake, Hourglass, CheckCircle, 
  Ban, XCircle, ClipboardList, Flag, ArrowRight, ShieldCheck 
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color, onClick }) => (
  <div 
    className={`bg-slate-800 rounded-xl p-5 border border-slate-700 flex items-center gap-4 transition-all duration-200 group ${onClick ? 'cursor-pointer hover:border-slate-600 hover:-translate-y-0.5' : ''}`} 
    style={{ '--c': color }} 
    onClick={onClick} 
    role={onClick ? 'button' : undefined}
  >
    <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ backgroundColor: `color-mix(in srgb, var(--c) 15%, transparent)`, color: 'var(--c)' }}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col flex-1">
      <span className="text-2xl font-extrabold text-white leading-none mb-1">{value}</span>
      <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
      {sub && <span className="text-xs text-slate-500 mt-1">{sub}</span>}
    </div>
    {onClick && (
      <span className="text-slate-600 group-hover:text-slate-400 transition-colors duration-200 shrink-0">
        <ArrowRight size={18} strokeWidth={2.5} />
      </span>
    )}
  </div>
);

const AdminDashboard = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page bg-slate-900 min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero */}
        <div 
          className="rounded-xl p-6 md:p-8 mb-8 border border-slate-700 relative overflow-hidden animate-fadeIn" 
          style={{ backgroundImage: 'linear-gradient(135deg, #12121a, #1a1226)' }}
        >
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1.5">Admin Panel</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Platform Overview</h1>
              <p className="text-sm font-medium text-slate-400">Monitor and moderate all users, volunteers, and profiles.</p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-slate-800/50 border border-slate-700 rounded-xl text-indigo-400">
              <ShieldCheck size={32} strokeWidth={2} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mb-4" />
            <span className="text-sm font-medium">Loading statistics...</span>
          </div>
        ) : stats ? (
          <>
            {/* User stats */}
            <section className="mb-10 animate-fadeIn" style={{ animationDelay: '.05s' }}>
              <h2 className="text-xs uppercase font-semibold text-gray-400 border-b border-slate-700/80 pb-2 mb-4 tracking-widest">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Total Users"   value={stats.users.total}      color="#6c63ff" />
                <StatCard icon={GraduationCap} label="Students"      value={stats.users.students}   color="#6c63ff" />
                <StatCard icon={Handshake} label="Volunteers"    value={stats.users.volunteers} color="#43e97b" />
              </div>
            </section>

            {/* Account status */}
            <section className="mb-10 animate-fadeIn" style={{ animationDelay: '.1s' }}>
              <h2 className="text-xs uppercase font-semibold text-gray-400 border-b border-slate-700/80 pb-2 mb-4 tracking-widest">Account Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Hourglass} label="Pending"   value={stats.accounts.pending}   color="#F59E0B"
                  sub="Awaiting review" onClick={() => navigate('/admin/users?status=Pending')} />
                <StatCard icon={CheckCircle} label="Approved"  value={stats.accounts.approved}  color="#22C55E"
                  onClick={() => navigate('/admin/users?status=Approved')} />
                <StatCard icon={Ban} label="Suspended" value={stats.accounts.suspended} color="#EF4444"
                  onClick={() => navigate('/admin/users?status=Suspended')} />
                <StatCard icon={XCircle} label="Rejected"  value={stats.accounts.rejected}  color="#EF4444"
                  onClick={() => navigate('/admin/users?status=Rejected')} />
              </div>
            </section>

            {/* Profile moderation */}
            <section className="mb-10 animate-fadeIn" style={{ animationDelay: '.15s' }}>
              <h2 className="text-xs uppercase font-semibold text-gray-400 border-b border-slate-700/80 pb-2 mb-4 tracking-widest">Volunteer Profiles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={ClipboardList} label="Pending Review" value={stats.profiles.pending}  color="#F59E0B"
                  sub="Need action" onClick={() => navigate('/admin/profiles?approvalStatus=Pending')} />
                <StatCard icon={CheckCircle} label="Approved"        value={stats.profiles.approved} color="#22C55E"
                  onClick={() => navigate('/admin/profiles?approvalStatus=Approved')} />
                <StatCard icon={XCircle} label="Rejected"        value={stats.profiles.rejected} color="#EF4444"
                  onClick={() => navigate('/admin/profiles?approvalStatus=Rejected')} />
                <StatCard icon={Flag} label="Flagged"         value={stats.profiles.flagged}  color="#EF4444"
                  sub="Needs attention" onClick={() => navigate('/admin/profiles?isFlagged=true')} />
              </div>
            </section>

            {/* Quick actions */}
            <section className="animate-fadeIn pb-12" style={{ animationDelay: '.2s' }}>
              <h2 className="text-xs uppercase font-semibold text-gray-400 border-b border-slate-700/80 pb-2 mb-4 tracking-widest">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-left hover:border-slate-600 transition-all duration-200 hover:-translate-y-0.5 group flex items-center gap-4 w-full" 
                  onClick={() => navigate('/admin/users?status=Pending')}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 text-amber-500 bg-amber-500/10">
                    <Hourglass size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-white mb-0.5">Review Pending Accounts</div>
                    <div className="text-xs font-medium text-slate-400">{stats.accounts.pending} accounts waiting</div>
                  </div>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors duration-200 shrink-0">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </span>
                </button>

                <button 
                  className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-left hover:border-slate-600 transition-all duration-200 hover:-translate-y-0.5 group flex items-center gap-4 w-full" 
                  onClick={() => navigate('/admin/profiles?approvalStatus=Pending')}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 text-amber-500 bg-amber-500/10">
                    <ClipboardList size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-white mb-0.5">Moderate Volunteer Profiles</div>
                    <div className="text-xs font-medium text-slate-400">{stats.profiles.pending} profiles pending</div>
                  </div>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors duration-200 shrink-0">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </span>
                </button>

                <button 
                  className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-left hover:border-slate-600 transition-all duration-200 hover:-translate-y-0.5 group flex items-center gap-4 w-full" 
                  onClick={() => navigate('/admin/profiles?isFlagged=true')}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 text-red-500 bg-red-500/10">
                    <Flag size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-white mb-0.5">Review Flagged Profiles</div>
                    <div className="text-xs font-medium text-slate-400">{stats.profiles.flagged} flagged profiles</div>
                  </div>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors duration-200 shrink-0">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </span>
                </button>

                <button 
                  className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-left hover:border-slate-600 transition-all duration-200 hover:-translate-y-0.5 group flex items-center gap-4 w-full" 
                  onClick={() => navigate('/admin/users')}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 text-indigo-400 bg-indigo-500/10">
                    <Users size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold text-white mb-0.5">Manage All Users</div>
                    <div className="text-xs font-medium text-slate-400">{stats.users.total} registered users</div>
                  </div>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors duration-200 shrink-0">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </span>
                </button>
              </div>
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-slate-400">
            <span className="text-sm font-medium">Could not load statistics.</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;