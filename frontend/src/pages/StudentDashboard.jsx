/**
 * pages/StudentDashboard.jsx — Home screen for student users
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import Navbar from '../components/Navbar';

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative overflow-hidden group" style={{ '--accent-color': color }}>
    <div className="text-2xl mb-3 relative z-10" style={{ color: 'var(--accent-color)' }}>{icon}</div>
    <div className="relative z-10">
      <span className="text-2xl font-bold text-white block mb-1">{value}</span>
      <span className="text-sm text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
    <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-transparent to-white/10" style={{ background: `linear-gradient(135deg, transparent, ${color}20)` }} />
  </div>
);

const ActionCard = ({ icon, title, desc, buttonLabel, onClick, variant = 'primary' }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden">
    {/* Background accent */}
    <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${
      variant === 'primary' ? 'from-indigo-500 to-purple-600' :
      variant === 'success' ? 'from-green-500 to-emerald-600' :
      'from-slate-600 to-slate-700'
    }`} />
    
    {/* Icon container */}
    <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-all duration-300 group-hover:scale-110 ${
      variant === 'primary' ? 'bg-indigo-500/20 border border-indigo-400/30 text-indigo-400' :
      variant === 'success' ? 'bg-green-500/20 border border-green-400/30 text-green-400' :
      'bg-slate-700/50 border border-slate-600/50 text-slate-400'
    }`}>
      {icon}
    </div>
    
    {/* Content */}
    <div className="relative z-10">
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">{title}</h3>
      <p className="text-slate-400 mb-6 leading-relaxed text-sm">{desc}</p>
      <button className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
        variant === 'primary' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25' :
        variant === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/25' :
        'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white shadow-slate-500/25'
      }`} onClick={onClick}>
        <span className="flex items-center justify-center gap-2">
          {buttonLabel}
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await messageAPI.getUnreadCount();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    fetchUnreadCount();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page">
      <Navbar />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Hero greeting */}
        <section className="mb-8 animate-fadeIn">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wide mb-2">{greeting} 👋</p>
              <h1 className="text-3xl font-bold text-white mb-3">{user?.name}</h1>
              <p className="text-slate-400">Ready to learn something new today?</p>
            </div>
            <div className="absolute top-8 right-8 text-4xl opacity-20">🎓</div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          </div>
        </section>

        {/* Stats row */}
        <section className="mb-8 animate-fadeIn" style={{ animationDelay: '.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="🤖" label="Chat Sessions"    value="AI Ready" color="#6c63ff" />
            <StatCard icon="🤝" label="Volunteers"        value="500+"     color="#43e97b" />
            <StatCard icon="⭐" label="Avg Tutor Rating"  value="4.8"      color="#fbbf24" />
            <StatCard icon="📚" label="Subjects Covered"  value="25+"      color="#ff6584" />
          </div>
        </section>

        {/* Action cards */}
        <section className="mb-8 animate-fadeIn" style={{ animationDelay: '.2s' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              icon="💬"
              title="Start Chatbot Session"
              desc="Tell our AI assistant what you need help with. It will guide you step by step to find the right tutor."
              buttonLabel="Open Chatbot →"
              onClick={() => navigate('/student/chat')}
            />
            <ActionCard
              icon="🧠"
              title="Find Volunteer Matches"
              desc="After completing the chatbot, our smart algorithm will rank the best volunteer tutors for you."
              buttonLabel="See My Matches →"
              onClick={() => navigate('/student/matches')}
              variant="success"
            />
            <ActionCard
              icon="📩"
              title="My Messages"
              desc={`You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}. Connect with your volunteer tutors here.`}
              buttonLabel={`Open Messages ${unreadCount > 0 ? `(${unreadCount})` : '→'}`}
              onClick={() => navigate('/messages')}
              variant={unreadCount > 0 ? 'primary' : 'secondary'}
            />
          </div>
        </section>

        {/* Study Support quick-access */}
        <section className="mb-8 animate-fadeIn" style={{ animationDelay: '.25s' }}>
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group" onClick={() => navigate('/study/student-dashboard')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Study Support Dashboard</h3>
                  <p className="text-sm text-slate-400">View your tutoring requests, leave reviews, and track sessions</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-purple-400 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </div>
        </section>

        {/* Quick tip */}
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 animate-fadeIn" style={{ animationDelay: '.3s' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <strong className="text-white block mb-1">Quick Tip:</strong> Start by clicking <em className="text-indigo-400">"Open Chatbot"</em> above.
              The assistant will ask 3 short questions and then instantly show you your best tutor matches.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;