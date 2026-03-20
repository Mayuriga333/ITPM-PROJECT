import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { storage } from '../../services/storage';
import RequestCard from '../Requests/RequestCard';
import StatsCard from './StatsCard';
import ReviewCard from './ReviewCard';
import Button from '../common/Button';

const StudentDashboard = () => {
  const [requests, setRequests] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [student] = useState(storage.getCurrentStudent());
  const [activeTab, setActiveTab] = useState('submitted'); // 'submitted' | 'enrolled'
  const navigate = useNavigate();

  useEffect(() => {
    // If there's no stored student (no login/registration), use mock stats and skip API calls.
    if (!student || !student._id) {
      setStats({
        totalSubmitted: 4,
        completed: 4,
        active: 0,
        pending: 0,
        needsReview: 1,
      });
      setLoading(false);
      return;
    }

    fetchDashboardData().catch(e => {
      console.log("Using mock data since API might not be available yet", e);
      setStats({
        totalSubmitted: 4,
        completed: 4,
        active: 0,
        pending: 0,
        needsReview: 1,
      });
      setLoading(false);
    });
  }, [student]);

  const fetchDashboardData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        studentAPI.getRequests(student._id),
        studentAPI.getStats(student._id)
      ]);
      setRequests(requestsRes.data || {});
      setStats(statsRes.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Flatten requests into a single list for the submitted view
  const submittedRequests = [
    ...(requests.pending || []),
    ...(requests.accepted || []),
    ...(requests.rejected || []),
    ...(requests.completed || []),
  ];

  // Simple mock data for enrolled courses (UI only for now)
  const enrolledCourses = [
    {
      id: '1',
      initials: 'SC',
      studentName: 'Sarah Chen',
      title: 'Python Tutoring',
      date: 'Oct 24, 2023',
      time: '2:00 PM',
      status: 'Scheduled',
    },
    {
      id: '2',
      initials: 'ER',
      studentName: 'Elena Rodriguez',
      title: 'Biology Review',
      date: 'Oct 20, 2023',
      time: '4:30 PM',
      status: 'Completed',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-screen flex bg-[#0A0D14] text-slate-300 font-sans overflow-hidden"
    >
      <div className="flex gap-8 w-full h-full">
        {/* Sidebar - match volunteer theme */}
        <aside className="w-[260px] bg-[#0F121C] border-r border-[#1C2033] flex flex-col p-6 shrink-0 h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-semibold">
              {(student && student.name ? student.name[0] : 'S').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Student Portal</p>
              <p className="text-xs text-indigo-200">Track your learning</p>
            </div>
          </div>

          <nav className="space-y-2 mt-2">
            <button
              type="button"
              onClick={() => setActiveTab('submitted')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'submitted'
                  ? 'bg-[#181D31] text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">➤</span>
              <span>Submitted Requests</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('enrolled')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'enrolled'
                  ? 'bg-[#181D31] text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">📚</span>
              <span>Enrolled Courses</span>
            </button>
          </nav>
        </aside>

        {/* Main content - match volunteer theme container */}
        <section className="flex-1 space-y-8 h-full bg-[#0B0F19] overflow-y-auto overflow-x-hidden p-8 pb-12">
          {activeTab === 'submitted' && (
            <>
              <header className="space-y-2">
                <h1 className="text-[32px] font-bold text-white tracking-tight">Submitted Requests</h1>
                <p className="text-indigo-200 text-[15px]">
                  Track the status of your tutoring requests.
                </p>
              </header>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <StatsCard title="Total Submitted" value={stats.totalSubmitted || 4} />
                  <StatsCard title="Pending" value={stats.pending || 1} />
                  <StatsCard title="Rejected" value={stats.rejected || 0} />
                </div>
              )}

              <div className="space-y-4 mt-4">
                {submittedRequests.length === 0 ? (
                  <div className="dark-card-container p-6 text-sm text-indigo-200">
                    You haven't submitted any requests yet.
                  </div>
                ) : (
                  submittedRequests.map((req) => (
                    <RequestCard key={req._id} request={req} type="student" />
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'enrolled' && (
            <>
              <header className="space-y-2">
                <h1 className="text-[32px] font-bold text-white tracking-tight">Enrolled Courses</h1>
                <p className="text-indigo-200 text-[15px]">
                  Manage your active and completed sessions.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    className="dark-card-container p-6 flex flex-col gap-4 border-t-4 border-indigo-500/80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white text-sm font-bold">
                          {course.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{course.studentName}</p>
                          <p className="text-xs text-indigo-200">{course.title}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-indigo-100">
                        {course.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-indigo-200 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                      <span>
                        {course.date}
                        <span className="mx-1">•</span>
                        {course.time}
                      </span>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button variant="outline" className="px-5 py-2 text-sm bg-transparent">
                        File a Dispute
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Quick action buttons (only show on submitted tab for now) */}
          {activeTab === 'submitted' && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={() => navigate('/discovery')} className="sm:w-auto px-8">
                Find a Volunteer
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/discovery')}
                className="sm:w-auto px-8 bg-transparent"
              >
                Browse All Volunteers
              </Button>
            </div>
          )}

          {/* Keep the review card available under the submitted view for now */}
          {activeTab === 'submitted' && (
            <div className="pt-4">
              <h2 className="text-[20px] font-bold text-indigo-100 mb-4">Pending Reviews</h2>
              <ReviewCard />
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;