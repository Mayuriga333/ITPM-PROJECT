/**
 * pages/AdminUsersPage.jsx — User listing, search, filtering, status control
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams }     from 'react-router-dom';
import { adminAPI }                          from '../services/api';
import Navbar                               from '../components/Navbar';
import { Search, Pencil, Trash2, AlertTriangle, X } from 'lucide-react';

const STATUS_COLORS = {
  Approved:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-500' },
  Pending:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-500' },
  Suspended: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-500' },
  Rejected:  { bg: 'bg-red-900/30',    border: 'border-red-800/50',    text: 'text-red-400' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.border} ${c.text}`}>
      {status}
    </span>
  );
};

const RoleBadge = ({ role }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
    role === 'Student' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 
    role === 'Volunteer' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
    'bg-purple-500/20 text-purple-400 border border-purple-500/30'
  }`}>{role}</span>
);

/* ── Status modal ──────────────────────────────────────────────────────────── */
const StatusModal = ({ user, onClose, onSave }) => {
  const [status, setStatus] = useState(user.status);
  const [reason, setReason] = useState(user.statusReason || '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await adminAPI.updateUserStatus(user._id, { status, reason });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl max-w-lg w-full border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Update Account Status</h3>
          <button className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg mb-6 shadow-inner">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{user.name.charAt(0)}</div>
            <div className="flex-1">
              <p className="text-white font-bold">{user.name}</p>
              <p className="text-slate-400 text-sm font-medium">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 mb-4 font-medium">{error}</div>}

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-300 mb-3">New Status</label>
            <div className="grid grid-cols-2 gap-3">
              {['Approved', 'Pending', 'Rejected', 'Suspended'].map((s) => (
                <label key={s} className={`p-3 rounded-xl border cursor-pointer transition-all ${status === s ? `${STATUS_COLORS[s].bg} ${STATUS_COLORS[s].border} ${STATUS_COLORS[s].text} ring-2 ring-current` : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:bg-slate-700/30'}`}>
                  <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                  <span className="text-sm font-bold">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {(status === 'Rejected' || status === 'Suspended') && (
            <div className="mb-6 animate-fadeIn">
              <label className="block text-sm font-bold text-slate-300 mb-2">Reason <span className="text-slate-500 font-medium text-xs">(shown to user)</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this action was taken…"
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 resize-vertical focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          <button className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex-1" onClick={onClose}>Cancel</button>
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete confirmation ─────────────────────────────────────────────────────── */
const DeleteModal = ({ user, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  const handleDelete = async () => {
    setDeleting(true); setError('');
    try {
      await adminAPI.deleteUser(user._id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete user.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl max-w-lg w-full border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Delete User Account</h3>
          <button className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={32} />
            <div>
              <p className="text-slate-200">This will permanently delete <strong className="text-white">{user.name}</strong> ({user.email}) and all their associated data including chat sessions and volunteer profile.</p>
              <p className="text-red-400 font-bold mt-2">This action cannot be undone.</p>
            </div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 mt-4 font-medium">{error}</div>}
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          <button className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex-1" onClick={onClose}>Cancel</button>
          <button className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={18} />}
            {deleting ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────────────────── */
const AdminUsersPage = () => {
  const navigate                  = useNavigate();
  const [searchParams]            = useSearchParams();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [roleFilter, setRole]     = useState('all');
  const [statusFilter, setStatus] = useState(searchParams.get('status') || 'all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [statusModal, setStatusModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({
        page,
        role:   roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleStatusSaved = () => { setStatusModal(null); fetchUsers(pagination.page); };
  const handleDeleted     = () => { setDeleteModal(null); fetchUsers(1); };

  return (
    <div className="page">
      <Navbar />
      <main className="container mx-auto px-6 py-8 max-w-7xl">

        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div>
            <button className="text-slate-400 font-medium hover:text-white transition-colors mb-4 inline-flex items-center gap-2" onClick={() => navigate('/admin')}>
              ← Dashboard
            </button>
            <h1 className="text-3xl font-extrabold text-white mb-2">User Management</h1>
            <p className="text-slate-400 font-medium">{pagination.total} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg animate-fadeIn" style={{ animationDelay: '.06s' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium shadow-inner"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" value={roleFilter} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="Student">Student</option>
            <option value="Volunteer">Volunteer</option>
          </select>
          <select className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto animate-fadeIn shadow-xl rounded-2xl border border-slate-700" style={{ animationDelay: '.1s' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16 bg-slate-800"><span className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin mr-3" /> <span className="text-slate-300 font-medium">Loading users…</span></div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 bg-slate-800 text-slate-400 font-medium">No users found for the selected filters.</div>
          ) : (
            <table className="w-full bg-slate-800">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500 shadow-inner shadow-black/20 rounded-full flex items-center justify-center text-white text-sm font-bold">{u.name.charAt(0)}</div>
                        <div>
                          <p className="text-white font-bold">{u.name}</p>
                          <p className="text-slate-400 text-sm font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <StatusBadge status={u.status} />
                        {u.statusReason && (
                          <span className="text-xs font-medium text-slate-400 truncate max-w-[180px] bg-slate-900/50 px-2 py-1 rounded" title={u.statusReason}>
                            {u.statusReason.length > 30 ? u.statusReason.slice(0, 30) + '…' : u.statusReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-bold group shadow-sm" onClick={() => setStatusModal(u)} title="Change status">
                          <Pencil size={14} className="text-indigo-300 group-hover:text-white" /> Status
                        </button>
                        <button className="p-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg transition-colors group shadow-sm" onClick={() => setDeleteModal(u)} title="Delete user">
                          <Trash2 size={16} className="text-red-400 group-hover:text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`px-4 py-2 font-bold rounded-lg transition-all shadow-sm ${p === pagination.page ? 'bg-indigo-600 text-white tracking-widest' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                onClick={() => fetchUsers(p)}>{p}</button>
            ))}
          </div>
        )}
      </main>

      {statusModal && <StatusModal user={statusModal} onClose={() => setStatusModal(null)} onSave={handleStatusSaved} />}
      {deleteModal && <DeleteModal user={deleteModal} onClose={() => setDeleteModal(null)} onDeleted={handleDeleted} />}
    </div>
  );
};

export default AdminUsersPage;