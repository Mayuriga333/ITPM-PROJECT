/**
 * pages/VolunteerDashboard.jsx — Tailwind CSS version
 */

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import { useSocket }           from '../context/SocketContext';
import { matchAPI }            from '../services/api';
import Navbar                  from '../components/Navbar';
import { X, Plus, Clock, Award, MessageCircle, Sparkles } from 'lucide-react';
import '../styles/VolunteerDashboard.css';

const TIME_SLOTS   = ['Morning', 'Afternoon', 'Evening', 'Weekend', 'Weekday'];
const SUBJECT_LIST = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Economics', 'Statistics'];

/* ─── Enhanced TagInput ─────────────────────────────────────────────────────────────── */
const TagInput = ({ tags, setTags, placeholder, suggestions = [] }) => {
  const [input, setInput] = useState('');

  const addTag = (tag) => {
    const v = (tag || input).trim();
    if (v && !tags.includes(v)) {
      setTags([...tags, v]);
      setInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="tag-input-container">
      <div className="tag-list">
        {tags.map((tag) => (
          <div key={tag} className="tag-item">
            {tag}
            <button
              className="tag-remove"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="empty-state">No subjects added yet. Start typing to add subjects.</div>
        )}
      </div>

      <div className="tag-input-wrapper">
        <input
          className="tag-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <button
          type="button"
          className="tag-add-btn"
          onClick={() => addTag()}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          {suggestions
            .filter((s) => !tags.includes(s))
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-chip"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

/* ─── VolunteerDashboard ────────────────────────────────────────────────────── */
const VolunteerDashboard = () => {
  const { user }        = useAuth();
  const { unreadCount } = useSocket();
  const navigate        = useNavigate();

  const [form, setForm] = useState({
    skills: [], availability: [], experienceLevel: 0, rating: 3.0, bio: '',
  });
  const [approvalStatus,  setApprovalStatus]  = useState('Pending');
  const [moderationNotes, setModerationNotes] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState({ type: '', text: '' });

  useEffect(() => {
    matchAPI.getMyProfile()
      .then(({ data }) => {
        if (data.profile) {
          setForm({
            skills:          data.profile.skills          || [],
            availability:    data.profile.availability    || [],
            experienceLevel: data.profile.experienceLevel || 0,
            rating:          data.profile.rating          || 3.0,
            bio:             data.profile.bio             || '',
          });
          setApprovalStatus(data.profile.approvalStatus   || 'Pending');
          setModerationNotes(data.profile.moderationNotes || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAvail = (v) => setForm((p) => ({
    ...p,
    availability: p.availability.includes(v)
      ? p.availability.filter((a) => a !== v)
      : [...p.availability, v],
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.skills.length === 0)       { setMsg({ type: 'error', text: 'Add at least one skill.' }); return; }
    if (form.availability.length === 0) { setMsg({ type: 'error', text: 'Select at least one availability slot.' }); return; }
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      await matchAPI.upsertProfile(form);
      setApprovalStatus('Pending');
      setMsg({ type: 'success', text: '✅ Profile saved! It will be reviewed before appearing in search results.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not save profile.' });
    } finally { setSaving(false); }
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── approval banner styles map ── */
  const approvalStyles = {
    Approved: {
      wrapper: 'bg-[rgba(67,233,123,0.08)] border border-[rgba(67,233,123,0.25)] text-[var(--accent3)]',
      body:    'text-[var(--muted)]',
    },
    Pending: {
      wrapper: 'bg-[rgba(251,191,36,0.07)] border border-[rgba(251,191,36,0.25)] text-[#fbbf24]',
      body:    'text-[var(--muted)]',
    },
    Rejected: {
      wrapper: 'bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-[#ef4444]',
      body:    'text-[rgba(239,68,68,0.8)]',
    },
  };
  const approval = approvalStyles[approvalStatus] ?? approvalStyles.Pending;

  return (
    <div className="page">
      <Navbar />
      <main className="dashboard-main container">

        {/* ── Enhanced Hero Section ── */}
        <section className="dashboard-hero fade-up">
          <div className="hero-text">
            <p className="hero-greeting">{greeting} 👋</p>
            <h1 className="hero-name">{user?.name}</h1>
            <p className="hero-sub">Keep your profile up to date so students can find you easily.</p>
          </div>
          <div className="hero-decoration">
            <div className="hero-orb" />
            <span className="hero-emoji">🤝</span>
          </div>
        </section>

        {/* ── Enhanced Stats Row ── */}
        <section className="stats-row fade-up" style={{ animationDelay: '.1s' }}>
          <div className="stat-card">
            <div className="stat-card-icon">
              <Sparkles size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{form.skills.length}</span>
              <span className="stat-card-label">Skills Listed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">
              <Clock size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{form.availability.length}</span>
              <span className="stat-card-label">Time Slots</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">
              <Award size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{form.experienceLevel}yr</span>
              <span className="stat-card-label">Experience</span>
            </div>
          </div>

          <div
            className="stat-card"
            onClick={() => navigate('/messages')}
            title="Open Messages"
          >
            <div className="stat-card-icon">
              <MessageCircle size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{unreadCount || 0}</span>
              <span className="stat-card-label">New Messages</span>
            </div>
          </div>
        </section>

        {/* ── Inbox alert banner ── */}
        {unreadCount > 0 && (
          <div
            onClick={() => navigate('/messages')}
            className="
              fade-up flex items-center gap-3
              bg-[rgba(255,101,132,0.07)] border border-[rgba(255,101,132,0.25)]
              rounded-[10px] px-[18px] py-[13px] text-[13px] text-[var(--text)]
              cursor-pointer transition-colors duration-[180ms]
              hover:bg-[rgba(255,101,132,0.13)]
            "
          >
            <span>📩</span>
            <span>
              You have{' '}
              <strong className="text-[#ff6584]">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </strong>{' '}
              from students
            </span>
            <span className="ml-auto text-sm text-[#ff6584]">→</span>
          </div>
        )}

        {/* ── Enhanced Loading / Form ── */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span>Loading profile…</span>
          </div>
        ) : (
          <form
            className="profile-form fade-up"
            style={{ animationDelay: '.2s' }}
            onSubmit={handleSave}
          >
            {/* ── Enhanced Approval Status Banner ── */}
            <div className={`approval-banner ${approvalStatus.toLowerCase()}`}>
              <div className="approval-icon">
                {approvalStatus === 'Approved' && '✅'}
                {approvalStatus === 'Pending'  && '⏳'}
                {approvalStatus === 'Rejected' && '❌'}
              </div>
              <div className="approval-content">
                <h3>Profile Status: {approvalStatus}</h3>
                {approvalStatus === 'Pending' && (
                  <p>Your profile is awaiting admin review before appearing in search results.</p>
                )}
                {approvalStatus === 'Approved' && (
                  <p>Your profile is live and visible to students in search results.</p>
                )}
                {approvalStatus === 'Rejected' && (
                  <p>Your profile was rejected{moderationNotes ? `: ${moderationNotes}` : '. Please update and resubmit.'}</p>
                )}
              </div>
            </div>

            <h2>My Volunteer Profile</h2>

            {msg.text && (
              <div className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</div>
            )}

            {/* Skills */}
            <div className="form-group">
              <label>Subjects / Skills *</label>
              <TagInput
                tags={form.skills}
                setTags={(newTags) => setForm((p) => ({ ...p, skills: newTags }))}
                suggestions={SUBJECT_LIST}
                placeholder="e.g. Mathematics"
              />
            </div>

            {/* Availability */}
            <div className="form-group">
              <label>Availability *</label>
              <div className="availability-options">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`availability-chip ${form.availability.includes(slot) ? 'active' : ''}`}
                    onClick={() => toggleAvail(slot)}
                  >
                    <div className="checkbox">
                      {form.availability.includes(slot) && '✓'}
                    </div>
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience & Rating */}
            <div className="form-row">
              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number" min="0" max="40"
                  value={form.experienceLevel}
                  onChange={(e) => setForm((p) => ({ ...p, experienceLevel: Number(e.target.value) }))}
                />
              </div>
              <div className="form-group">
                <label>Rating (0–5)</label>
                <input
                  type="number" min="0" max="5" step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label>Short Bio</label>
              <textarea
                rows={3}
                maxLength={400}
                placeholder="Tell students about yourself…"
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
              <span className="block text-xs text-[var(--muted)] mt-1">{form.bio.length}/400 characters</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t border-[var(--dashboard-glass-border)] flex-wrap">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/messages')}
              >
                <MessageCircle size={16} />
                My Messages {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button className="btn-green" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default VolunteerDashboard;