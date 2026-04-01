/**
 * pages/AdminProfilesPage.jsx — Volunteer profile moderation (approve/reject/flag)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams }     from 'react-router-dom';
import { adminAPI }                          from '../services/api';
import Navbar                               from '../components/Navbar';
import { Flag, Medal, Star, Clock, StickyNote, Pencil, CheckCircle, X } from 'lucide-react';

const APPROVAL_COLORS = {
  Approved: { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-500' },
  Pending:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-500' },
  Rejected: { bg: 'bg-red-900/30',   border: 'border-red-800/50',   text: 'text-red-400' },
};

const ApprovalBadge = ({ status }) => {
  const c = APPROVAL_COLORS[status] || APPROVAL_COLORS.Pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.border} ${c.text}`}>
      {status}
    </span>
  );
};

/* ── Moderation modal ───────────────────────────────────────────────────────── */
const ModerateModal = ({ profile, onClose, onSaved }) => {
  const [status, setStatus] = useState(profile.approvalStatus);
  const [notes,  setNotes]  = useState(profile.moderationNotes || '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await adminAPI.moderateProfile(profile._id, { approvalStatus: status, notes });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally { setSaving(false); }
  };

  const vol = profile.userId;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Moderate Volunteer Profile</h3>
          <button className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6">
          {/* Volunteer info */}
          <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg mb-6 shadow-inner">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{vol?.name?.charAt(0) || '?'}</div>
            <div className="flex-1">
              <p className="text-white font-bold">{vol?.name || 'Unknown'}</p>
              <p className="text-slate-400 text-sm font-medium">{vol?.email}</p>
            </div>
            <ApprovalBadge status={profile.approvalStatus} />
          </div>

          {/* Skills preview */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-4">
              <span className="text-sm font-bold text-slate-400 min-w-[80px]">Skills</span>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).map((s) => <span key={s} className="px-2 py-1 bg-blue-500/20 text-blue-400 font-semibold rounded-md text-xs">{s}</span>)}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-sm font-bold text-slate-400 min-w-[80px]">Availability</span>
              <div className="flex flex-wrap gap-2">
                {(profile.availability || []).map((a) => <span key={a} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 font-semibold rounded-md text-xs">{a}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-400 min-w-[80px]">Experience</span>
              <span className="text-white font-medium flex items-center gap-1.5"><Medal size={16} className="text-indigo-400" /> {profile.experienceLevel} yr{profile.experienceLevel !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-400 min-w-[80px]">Rating</span>
              <span className="text-white font-medium flex items-center gap-1.5"><Star size={16} className="text-amber-400" /> {profile.rating?.toFixed(1)} / 5.0</span>
            </div>
            {profile.bio && (
              <div className="flex items-start gap-4">
                <span className="text-sm font-bold text-slate-400 min-w-[80px]">Bio</span>
                <span className="text-slate-300 italic">"{profile.bio}"</span>
              </div>
            )}
            {profile.isFlagged && (
              <div className="flex items-start gap-4 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                <span className="text-sm font-bold text-red-400 min-w-[80px] flex items-center gap-1.5"><Flag size={14} /> Flag</span>
                <span className="text-red-300 font-medium">{profile.flagReason || 'Flagged for review'}</span>
              </div>
            )}
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 mb-4 font-medium">{error}</div>}

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-300 mb-3">Approval Decision</label>
            <div className="flex gap-3">
              {['Approved', 'Pending', 'Rejected'].map((s) => {
                const c = APPROVAL_COLORS[s];
                return (
                  <label key={s} className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all ${status === s ? `${c.bg} ${c.border} ${c.text} ring-2 ring-current` : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:bg-slate-700/30'}`}>
                    <input type="radio" name="approvalStatus" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                    <span className="text-sm font-bold block text-center">{s}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-300 mb-2">Moderation Notes <span className="text-slate-500 font-medium text-xs">(shared with volunteer)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for volunteer explaining decision…"
              rows={3}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 resize-vertical focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          <button className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex-1" onClick={onClose}>Cancel</button>
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex-[2] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Decision'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────────────────── */
const AdminProfilesPage = () => {
  const navigate               = useNavigate();
  const [searchParams]         = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [approvalFilter, setApproval] = useState(searchParams.get('approvalStatus') || 'all');
  const [flaggedOnly,    setFlagged]  = useState(searchParams.get('isFlagged') === 'true');
  const [pagination, setPagination]   = useState({ total: 0, page: 1, pages: 1 });
  const [moderateModal, setModerate]  = useState(null);

  const fetchProfiles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getProfiles({
        page,
        approvalStatus: approvalFilter !== 'all' ? approvalFilter : undefined,
        isFlagged:      flaggedOnly || undefined,
      });
      setProfiles(data.profiles);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [approvalFilter, flaggedOnly]);

  useEffect(() => { fetchProfiles(1); }, [fetchProfiles]);

  const handleFlag = async (profile) => {
    try {
      await adminAPI.flagProfile(profile._id, {
        isFlagged:  !profile.isFlagged,
        flagReason: profile.isFlagged ? '' : 'Flagged by admin for review',
      });
      fetchProfiles(pagination.page);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container mx-auto px-6 py-8 max-w-7xl">

        <div className="mb-8 animate-fadeIn">
          <div>
            <button className="text-slate-400 font-medium hover:text-white transition-colors mb-4 inline-flex items-center gap-2" onClick={() => navigate('/admin')}>
              ← Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-white mb-2">Volunteer Profile Moderation</h1>
            <p className="text-slate-400 font-medium">{pagination.total} profiles</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg animate-fadeIn" style={{ animationDelay: '.06s' }}>
          <select className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" value={approvalFilter} onChange={(e) => setApproval(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <label className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-slate-300 font-medium cursor-pointer hover:border-slate-500 transition-colors shadow-inner">
            <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlagged(e.target.checked)} className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer" />
            <Flag size={16} className={flaggedOnly ? 'text-red-400' : 'text-slate-500'} /> Flagged only
          </label>
        </div>

        {/* Profile cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-slate-800/50 rounded-2xl animate-fadeIn border border-slate-700/50"><span className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin mr-3" /> <span className="text-slate-300 font-medium">Loading profiles…</span></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/50 rounded-2xl text-slate-400 font-medium animate-fadeIn border border-slate-700/50">No profiles found for selected filters.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn" style={{ animationDelay: '.1s' }}>
            {profiles.map((p) => (
              <div key={p._id} className={`bg-slate-800 rounded-2xl border ${p.isFlagged ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-700'} overflow-hidden relative shadow-lg hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200 group`}>
                {p.isFlagged && <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 z-10"><Flag size={12} strokeWidth={3} /> Flagged</div>}

                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 bg-indigo-500 shadow-inner rounded-full flex items-center justify-center text-white font-bold text-xl">{p.userId?.name?.charAt(0) || '?'}</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-white font-bold truncate">{p.userId?.name || 'Unknown'}</p>
                      <p className="text-slate-400 text-sm font-medium truncate mb-2">{p.userId?.email}</p>
                      <ApprovalBadge status={p.approvalStatus} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {(p.skills || []).slice(0, 3).map((s) => <span key={s} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">{s}</span>)}
                    {p.skills?.length > 3 && <span className="px-2.5 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-xs font-bold">+{p.skills.length - 3}</span>}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-400 mb-5 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <span className="flex items-center gap-1.5"><Medal size={16} className="text-indigo-400" /> {p.experienceLevel}yr exp</span>
                    <span className="flex items-center gap-1.5"><Star size={16} className="text-amber-400" /> {p.rating?.toFixed(1) || '0.0'}</span>
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-emerald-400" /> <span className="truncate max-w-[100px]" title={(p.availability || []).join(', ')}>{(p.availability || [])[0] || 'N/A'}</span></span>
                  </div>

                  {p.moderationNotes && (
                    <div className="mb-5 p-3.5 bg-slate-700/40 border border-slate-600/50 rounded-xl text-sm font-medium text-slate-300 flex items-start gap-2.5">
                      <StickyNote size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" /> 
                      <p className="leading-relaxed">{p.moderationNotes}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 group-hover:border group-hover:border-indigo-500/30" onClick={() => setModerate(p)}>
                      <Pencil size={16} className="hidden lg:block" /> Review
                    </button>
                    <button
                      className={`flex-1 py-2.5 font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 ${p.isFlagged ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'}`}
                      onClick={() => handleFlag(p)}
                    >
                      {p.isFlagged ? <><CheckCircle size={16} className="hidden lg:block" /> Unflag</> : <><Flag size={16} className="hidden lg:block" /> Flag</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`px-4 py-2 font-bold rounded-lg transition-all shadow-sm ${p === pagination.page ? 'bg-indigo-600 text-white tracking-widest' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                onClick={() => fetchProfiles(p)}>{p}</button>
            ))}
          </div>
        )}
      </main>

      {moderateModal && (
        <ModerateModal
          profile={moderateModal}
          onClose={() => setModerate(null)}
          onSaved={() => { setModerate(null); fetchProfiles(pagination.page); }}
        />
      )}
    </div>
  );
};

export default AdminProfilesPage;