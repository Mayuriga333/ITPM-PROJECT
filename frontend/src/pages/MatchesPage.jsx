/**
 * pages/MatchesPage.jsx — Displays top 3 matched volunteers with score breakdown
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchAPI, messageAPI } from '../services/api';
import Navbar from '../components/Navbar';

const ScoreBar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="text-sm text-slate-400 min-w-24">{label}</span>
    <div className="flex-1 bg-slate-700 rounded-full h-2 relative overflow-hidden">
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
    <span className="text-sm font-medium text-white min-w-12">+{value}</span>
  </div>
);

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`text-lg ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-600'}`}>★</span>
    );
  }
  return <div className="flex gap-1">{stars}</div>;
};

const VolunteerCard = ({ match, rank, needs, onStartConversation }) => {
  const { profile, score, breakdown } = match;
  const rankColors = { 1: '#fbbf24', 2: '#9ca3af', 3: '#b45309' };
  const rankEmoji  = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const [startingConversation, setStartingConversation] = useState(false);
  const navigate = useNavigate();

  const handleStartConversation = async () => {
    setStartingConversation(true);
    try {
      await onStartConversation(profile.userId, needs);
    } finally {
      setStartingConversation(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative animate-fadeIn" style={{ animationDelay: `${rank * 0.12}s` }}>
      {/* Rank badge */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-lg text-white font-bold text-sm" style={{ background: rankColors[rank] }}>
        {rankEmoji[rank]} #{rank}
      </div>

      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {profile.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{profile.name}</h3>
            <p className="text-slate-400 text-sm">{profile.email}</p>
            <StarRating rating={profile.rating} />
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white block">{score}</span>
            <span className="text-sm text-slate-400">pts</span>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="p-6 border-b border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-3">Subjects</h4>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span key={s} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs">{s}</span>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="p-6 border-b border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-3">Availability</h4>
        <div className="flex flex-wrap gap-2">
          {profile.availability.map((a) => (
            <span key={a} className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">{a}</span>
          ))}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="p-6 border-b border-slate-700">
          <p className="text-slate-300 italic">"{profile.bio}"</p>
        </div>
      )}

      {/* Score breakdown */}
      <div className="p-6 border-b border-slate-700">
        <h4 className="text-sm font-semibold text-white mb-3">Score Breakdown</h4>
        <div className="space-y-2">
          <ScoreBar label="Skill Match"   value={breakdown.skill}        max={50} color="#6c63ff" />
          <ScoreBar label="Availability"  value={breakdown.availability} max={20} color="#43e97b" />
          <ScoreBar label="Experience"    value={breakdown.experience}   max={10} color="#fbbf24" />
          <ScoreBar label="Rating"        value={breakdown.rating}       max={25} color="#ff6584" />
        </div>
      </div>

      {/* Actions */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-md text-sm">
            🏅 {profile.experienceLevel} yr{profile.experienceLevel !== 1 ? 's' : ''} experience
          </span>
          <span className="text-slate-300 text-sm">⭐ {profile.rating.toFixed(1)} / 5.0</span>
        </div>
        <button
          onClick={handleStartConversation}
          disabled={startingConversation}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {startingConversation ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              💬 Start Conversation
            </>
          )}
        </button>
        {profile.studyVolunteerId && (
          <button
            onClick={() => navigate(`/study/request/${profile.studyVolunteerId}`)}
            className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            📚 Request Support
          </button>
        )}
      </div>
    </div>
  );
};

const MatchesPage = () => {
  const [matches, setMatches]   = useState([]);
  const [needs,   setNeeds]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await matchAPI.getMatches();
        setMatches(data.matches || []);
        setNeeds(data.needs);
      } catch (err) {
        const msg = err.response?.data?.message || 'Could not fetch matches.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleStartConversation = async (volunteerId, needs) => {
    try {
      const { data } = await messageAPI.startConversation({
        volunteerId,
        subject: needs?.subject || '',
        topic: needs?.topic || '',
        preferredTime: needs?.preferredTime || ''
      });
      
      // Navigate to messages page after starting conversation
      navigate('/messages');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start conversation.';
      setError(msg);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="page">
      <Navbar />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Your Top Matches</h1>
              <p className="text-slate-400">
                {needs
                  ? `Best volunteers for "${needs.subject}" — ${needs.topic}" in ${needs.preferredTime}`
                  : 'Ranked by our smart matching algorithm'}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors" onClick={() => navigate('/student/chat')}>
                ← Back to Chat
              </button>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors" onClick={() => navigate('/messages')}>
                💬 Messages
              </button>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors" onClick={() => window.location.reload()}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500">
              {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Finding your best volunteer matches…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && !error.includes('conversation') && (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500 mb-4 inline-block">{error}</div>
            {error.includes('chatbot') && (
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors mt-4" onClick={() => navigate('/student/chat')}>
                Go to Chatbot →
              </button>
            )}
          </div>
        )}

        {/* No matches */}
        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4">🤷</span>
            <h3 className="text-xl font-semibold text-white mb-2">No volunteers found</h3>
            <p className="text-slate-400">There are no volunteers matching your requirements yet. Check back soon!</p>
          </div>
        )}

        {/* Match cards */}
        {!loading && !error && matches.length > 0 && (
          <>
            <div className="mb-8 p-4 bg-slate-800 rounded-xl border border-slate-700 animate-fadeIn">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <strong className="text-white block mb-1">Smart Matching Algorithm</strong>
                  <p className="text-slate-400 text-sm">Volunteers are scored by: Skill Match (+50) · Availability (+20) · Experience (+10) · Rating (×5)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {matches.map((match, i) => (
                <VolunteerCard 
                  key={match.profile._id} 
                  match={match} 
                  rank={i + 1} 
                  needs={needs}
                  onStartConversation={handleStartConversation}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MatchesPage;