import React, { useState } from 'react';
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
  const [activeSidebarTab, setActiveSidebarTab] = useState('requests');
  const [activeInboxTab, setActiveInboxTab] = useState('pending');
  const [inbox, setInbox] = useState(INITIAL_INBOX);

  const handleAction = (id, action) => {
    // Basic mock logic
    setInbox((prev) => prev.filter((req) => req.id !== id));
  };

  return (
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
              onClick={() => setActiveSidebarTab('requests')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeSidebarTab === 'requests'
                  ? 'bg-[#181D31] text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <InboxIcon className="w-5 h-5" />
              Requests
            </button>
            <button
              onClick={() => setActiveSidebarTab('sessions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeSidebarTab === 'sessions'
                  ? 'bg-[#181D31] text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpenIcon className="w-5 h-5" />
              Sessions
            </button>
          </nav>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-y-auto overflow-x-hidden p-8 pb-12">
        {/* Dashboard Title & Top Actions */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-[32px] font-bold text-white mb-1">Volunteer Dashboard</h2>
            <p className="text-slate-400 text-sm">
              You're making a difference. <span className="text-emerald-400">3 new requests</span> since yesterday.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm font-semibold text-slate-400">Status:</span>
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-full text-sm">
               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
               Available Now
             </div>
          </div>
        </div>

        {/* 3. METRICS CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Total Requests Card */}
          <div className="bg-[#141824] border border-[#21273B] rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <MessageSquare className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
              </div>
              <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Global</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">15</div>
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
              <div className="text-3xl font-bold text-white mb-1">3</div>
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
              <div className="text-3xl font-bold text-white mb-1">2</div>
              <div className="text-sm text-slate-400">Accepted Today</div>
            </div>
          </div>

          {/* Completed Sessions Card */}
          <div className="bg-[#141824] border border-[#21273B] rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Award className="w-5 h-5 text-purple-400 fill-purple-400/20" />
              </div>
              <span className="text-[10px] font-bold text-purple-400 tracking-wider uppercase">Milestone</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">45</div>
              <div className="text-sm text-slate-400">Completed Sessions</div>
            </div>
          </div>

        </div>

        {/* 4. MAIN CONTENT SWITCHED BY SIDEBAR TABS */}
        {activeSidebarTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 flex-1">
            {/* Left Column: Request Inbox */}
            <div className="bg-[#141824] border border-[#1E2335] rounded-3xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6">Request Inbox</h3>

              {/* Pill Tabs */}
              <div className="bg-[#0B0F19] rounded-2xl p-1 flex items-center mb-6 self-start">
                {['Pending', 'Accepted', 'Completed', 'Rejected'].map((tab) => (
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
                {inbox.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0F121C] border border-[#1C2033] rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar initials="L" className="w-12 h-12 bg-amber-200 text-amber-900 rounded-xl" />
                        <div>
                          <h4 className="text-white font-bold text-lg">{req.student}</h4>
                          <p className="text-indigo-400 text-sm">Subject: {req.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-semibold">{req.time.split(' ')[0]}</p>
                        <p className="text-slate-400 text-xs">
                          {req.time.split(' ')[1]} {req.time.split(' ')[2]}
                        </p>
                      </div>
                    </div>

                    {/* Message Bubble */}
                    <div className="bg-[#151928] border-l-2 border-indigo-500 p-4 rounded-r-2xl rounded-bl-2xl text-slate-300 text-sm mb-5">
                      "{req.message}"
                    </div>

                    {/* Actions */}
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
                  </motion.div>
                ))}

                {inbox.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center border-t border-[#1C2033]/50">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3"></div>
                    <p className="text-sm text-slate-500">Fetching new inquiries...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSidebarTab === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            {/* Performance Snapshot */}
            <div className="bg-[#141824] border border-[#1E2335] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Performance Snapshot</h3>

              <div className="flex justify-between items-center mb-8 px-2">
                <div className="text-center">
                  <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Avg Rating</p>
                  <div className="flex items-center justify-center text-white text-2xl font-bold">
                    4.95 <Star className="w-4 h-4 ml-1 text-amber-400 fill-amber-400" />
                  </div>
                </div>
                <div className="w-px h-10 bg-[#21273B]"></div>
                <div className="text-center">
                  <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Total Hours</p>
                  <p className="text-white text-2xl font-bold">120</p>
                </div>
              </div>

              {/* Progress Bar Limit */}
              <div>
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span className="text-slate-300">Daily Capacity</span>
                  <span className="text-indigo-400">2 / 5 sessions</span>
                </div>
                <div className="h-2 w-full bg-[#1C2033] rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[#2CD27B] rounded-full w-[40%] shadow-[0_0_10px_rgba(44,210,123,0.5)]"></div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You have bandwidth for 3 more students today.
                </p>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-[#141824] border border-[#1E2335] rounded-3xl p-6 flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Upcoming Sessions</h3>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-[#21273B]">
                {/* Session 1 */}
                <div className="relative">
                  <div className="absolute left-[-24px] w-[14px] h-[14px] rounded-full bg-[#0B0F19] border-[3px] border-indigo-500 z-10 flex items-center justify-center"></div>
                  <div className="bg-[#1B2031] border border-[#262C44] rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">14:00 - 15:00</span>
                      <span className="text-xs font-medium text-slate-400">Today</span>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">Calculus III: Optimization</h4>
                    <p className="text-slate-400 text-xs mb-4">with Sarah Jenkins</p>
                    <button className="w-full bg-[#262C44] hover:bg-[#2E3652] text-slate-300 text-xs font-semibold py-2 rounded-xl transition-colors">
                      Mark Completed
                    </button>
                  </div>
                </div>

                {/* Session 2 */}
                <div className="relative">
                  <div className="absolute left-[-24px] w-[14px] h-[14px] rounded-full bg-[#0B0F19] border-[3px] border-[#262C44] z-10 flex items-center justify-center"></div>
                  <div className="bg-[#111420] border border-[#1E2335] rounded-2xl p-4 opacity-70">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-400 bg-white/5 px-2 py-1 rounded-md">09:00 - 10:30</span>
                      <span className="text-xs font-medium text-slate-500">Tomorrow</span>
                    </div>
                    <h4 className="text-slate-300 font-bold text-sm mb-1">Intro to Python: Arrays</h4>
                    <p className="text-slate-500 text-xs mb-4">with Kevin Zhang</p>
                    <button className="w-full bg-[#1C2033] text-slate-500 text-xs font-semibold py-2 rounded-xl cursor-not-allowed">
                      Upcoming
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
