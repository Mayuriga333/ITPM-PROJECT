import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  InboxIcon, 
  BookOpenIcon, 
  MessageSquare, 
  CheckCircle,
  Clock,
  ThumbsUp,
  Award,
  Star,
  Calendar,
  MoreVertical
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { volunteerAPI, requestAPI } from '../services/api';
import toast from 'react-hot-toast';
import StarRating from '../components/common/StarRating';
import UserMenu from '../components/common/UserMenu';
import { useNavigate } from 'react-router-dom';

// Mock Data matching the new UI exactly
const INITIAL_INBOX = [
  { 
    id: 'REQ-203', 
    student: "Liam O'Brien", 
    subject: 'Discrete Math', 
    time: 'Oct 28 10:00 AM',
    message: "Hi! I'm struggling with set theory proofs. Can you help?",
    status: 'pending'
  }
];

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeInboxTab, setActiveInboxTab] = useState('pending');
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  // const [chatOpen, setChatOpen] = useState(false);
  // const [chatPeer, setChatPeer] = useState(null);

  const volunteerId = user?.id || JSON.parse(localStorage.getItem('currentVolunteer'))?._id;

  useEffect(() => {
    if (volunteerId) {
      fetchDashboardData();
    }
  }, [volunteerId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes] = await Promise.all([
        volunteerAPI.getRequests(volunteerId),
        volunteerAPI.getStats(volunteerId)
      ]);

      const requestsData = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      
      const mappedInbox = requestsData.map(req => ({
        id: req._id,
        student: req.studentName || req.student?.name || 'Unknown Student',
        studentId: req.student?._id,
        subject: req.subject,
        time: new Date(req.createdAt).toLocaleString(),
        message: req.message || 'No message provided',
        rejectReason: req.rejectReason,
        status: req.status,
        rating: req.rating,
        reviewText: req.reviewText,
        reviewSubject: req.reviewSubject,
        reviewCreatedAt: req.reviewCreatedAt,
      }));

      setInbox(mappedInbox);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (req) => {
    if (!req?.studentId) {
      toast.error('This request has no linked student account');
      return;
    }

    navigate('/chat');
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'accept') {
        await requestAPI.accept(id);
        toast.success('Request accepted!');
        fetchDashboardData();
      } else if (action === 'reject') {
        setRejectingId(id);
        setShowRejectModal(true);
      }
    } catch (error) {
      console.error('Action error', error);
      toast.error('Failed to process request');
    }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    
    try {
      await requestAPI.reject(rejectingId, rejectReason);
      toast.success('Request rejected!');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Reject error', error);
      toast.error('Failed to reject request');
    }
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setRejectingId(null);
  };

  const filteredInbox = inbox.filter((r) => r.status === activeInboxTab);

  const pendingCount = inbox.filter(r => r.status === 'pending').length;
  const acceptedCount = inbox.filter(r => r.status === 'accepted').length;
  const totalCount = inbox.length;

  return (
    <>
      <div className="flex h-screen w-full bg-[#0A0D14] text-slate-300 font-sans overflow-hidden">
        
        {/* 1. LEFT SIDEBAR */}
      <aside className="w-[260px] bg-[#0F121C] border-r border-[#1C2033] flex flex-col justify-between shrink-0 h-full p-6">
        <div>
          {/* Logo & Brand - match student dashboard style */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-semibold">
              V
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Volunteer Portal</p>
              <p className="text-xs text-indigo-200">Support your students</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-[#181D31] text-indigo-400"
            >
              <InboxIcon className="w-5 h-5" />
              Requests
            </button>

            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-[#181D31] text-slate-300"
            >
              <MessageSquare className="w-5 h-5" />
              Chats
            </button>
          </nav>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-y-auto overflow-x-hidden p-8 pb-12">
        {/* Dashboard Title & Top Actions */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-[32px] font-bold text-white mb-1">Volunteer Dashboard</h2>
            <p className="text-slate-400 text-sm">
              You're making a difference. <span className="text-emerald-400">{pendingCount} new requests</span> since yesterday.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-400">Status:</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-full text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                Available Now
              </div>
            </div>
            <UserMenu />
          </div>
        </div>

        {/* 3. METRICS CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          
          {/* Total Requests Card */}
          <div className="bg-[#141824] border border-[#21273B] rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <MessageSquare className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
              </div>
              <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Global</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">{totalCount}</div>
              <div className="text-sm text-slate-400">Total Requests</div>
            </div>
          </div>

          {/* Action Needed Card */}
          <div className="bg-[#141824] border border-[#21273B] rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              </div>
              <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">Action Needed</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">{pendingCount}</div>
              <div className="text-sm text-slate-400">Pending Requests</div>
            </div>
          </div>

          {/* Accepted Today Card */}
          <div className="bg-[#141824] border border-[#21273B] rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Growth</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">{acceptedCount}</div>
              <div className="text-sm text-slate-400">Accepted</div>
            </div>
          </div>

          </div>

          {/* 4. MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 flex-1">
          {/* Left Column: Request Inbox */}
            <div className="bg-[#141824] border border-[#1E2335] rounded-3xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6">Request Inbox</h3>

              {/* Pill Tabs */}
              <div className="bg-[#0B0F19] rounded-2xl p-1 flex items-center mb-6 self-start">
                {['Pending', 'Accepted', 'Rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveInboxTab(tab.toLowerCase())}
                    className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
                      activeInboxTab === tab.toLowerCase()
                        ? 'bg-[#5046E5] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Request List */}
              <div className="flex-1 space-y-4">
                {loading ? (
                  <div className="h-40 flex flex-col items-center justify-center border-t border-[#1C2033]/50">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3"></div>
                    <p className="text-sm text-slate-500">Fetching inquiries...</p>
                  </div>
                ) : (
                  <>
                    {filteredInbox.map((req) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0F121C] border border-[#1C2033] rounded-2xl p-5"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar initials={req.student.charAt(0)} className="w-12 h-12 bg-amber-200 text-amber-900 rounded-xl" />
                            <div>
                              <h4 className="text-white font-bold text-lg">{req.student}</h4>
                              <p className="text-indigo-400 text-sm">Subject: {req.subject}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm font-semibold">{req.time.split(',')[0]}</p>
                            <p className="text-slate-400 text-xs">
                              {req.time.split(',')[1]}
                            </p>
                          </div>
                        </div>

                        {/* Message Bubble */}
                        <div className="bg-[#151928] border-l-2 border-indigo-500 p-4 rounded-r-2xl rounded-bl-2xl text-slate-300 text-sm mb-4">
                          <p>"{req.message}"</p>
                          {req.status === 'rejected' && req.rejectReason && (
                            <div className="mt-3 pt-3 border-t border-indigo-500/20 text-rose-300">
                              <span className="font-semibold text-rose-400">Rejection Reason:</span> {req.rejectReason}
                            </div>
                          )}
                        </div>

                        {/* Rating & Review (visible for accepted/completed sessions) */}
                        {['accepted', 'completed'].includes(req.status) && typeof req.rating === 'number' && req.rating > 0 && (
                          <div className="mb-5 bg-[#0B0F19] border border-[#1C2033] rounded-2xl px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                  Student Rating
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {req.reviewSubject || req.subject}
                                </p>
                              </div>
                              <StarRating initialRating={req.rating} readOnly />
                            </div>

                            {req.reviewText && (
                              <p className="text-xs text-slate-200 mt-1">
                                “{req.reviewText}”
                              </p>
                            )}

                            {req.reviewCreatedAt && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(req.reviewCreatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {activeInboxTab === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAction(req.id, 'accept')}
                              className="px-8 py-2.5 rounded-xl bg-[#2CD27B] hover:bg-[#25B468] text-[#0A2616] font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAction(req.id, 'reject')}
                              className="px-8 py-2.5 rounded-xl bg-[#2A1E24] hover:bg-[#34242D] border border-red-500/20 text-rose-400 font-bold text-sm transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {activeInboxTab === 'accepted' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => openChat(req)}
                              className="px-8 py-2.5 rounded-xl bg-[#5046E5] hover:bg-[#4338CA] text-white font-bold text-sm transition-colors"
                            >
                              Chat
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {!loading && filteredInbox.length === 0 && (
                      <div className="h-40 flex flex-col items-center justify-center border-t border-[#1C2033]/50">
                        <p className="text-sm text-slate-500">No requests here yet.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
      </main>
    </div>

    {/* Reject Reason Modal */}
    {showRejectModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-[#141824] border border-[#21273B] rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Reject Request</h3>
          <p className="text-sm text-slate-400 mb-6">Please provide a short reason for rejecting this session so the student understands why.</p>
          
          <textarea 
            className="w-full bg-[#0B0F19] border border-[#1C2033] rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none h-32 mb-6"
            placeholder="E.g., I'm sorry, but my schedule is full for this week..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={cancelReject}
              className="px-6 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-slate-300 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmReject}
              className="px-6 py-2.5 rounded-xl bg-[#2A1E24] hover:bg-[#34242D] border border-red-500/20 text-rose-400 font-bold text-sm transition-colors"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

