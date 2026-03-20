import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Users } from 'lucide-react';
import { volunteerAPI, requestAPI } from '../../services/api';
import { storage } from '../../services/storage';
import RequestCard from '../Requests/RequestCard';
import StatsCard from './StatsCard';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'accepted'
  const volunteer = storage.getCurrentVolunteer();

  useEffect(() => {
    if (volunteer) {
      fetchDashboardData();
    }
  }, [volunteer]);

  const fetchDashboardData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        volunteerAPI.getRequests(volunteer._id),
        volunteerAPI.getStats(volunteer._id)
      ]);
      
      setRequests(requestsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await requestAPI.accept(requestId);
      toast.success('Request accepted successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await requestAPI.reject(requestId);
      toast.success('Request rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const incomingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedCourses = requests.filter((r) => r.status === 'accepted' || r.status === 'completed');

  return (
    <div className="w-full px-0 py-0">
      <div className="flex gap-8 min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 h-screen bg-transparent border-none pl-16 pt-12 flex flex-col">
          <p className="text-xs font-semibold tracking-[0.15em] text-indigo-200 mb-4">MENU</p>

          <nav className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-medium transition-all shadow-lg ${
                activeTab === 'incoming'
                  ? 'bg-indigo-500 text-white shadow-indigo-500/40'
                  : 'bg-white/5 text-indigo-100 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15">
                  📥
                </span>
                <span>Requests</span>
              </span>
              {incomingRequests.length > 0 && (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-indigo-600 text-xs font-semibold">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accepted')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-medium transition-colors ${
                activeTab === 'accepted'
                  ? 'text-white'
                  : 'text-indigo-200'
              } hover:bg-white/5`}
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10">
                📚
              </span>
              <span>Sessions</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1 space-y-8">
          {activeTab === 'incoming' && (
            <>
              <header className="space-y-2">
                <h1 className="text-[32px] font-bold text-white tracking-tight">Incoming Requests</h1>
                <p className="text-indigo-200 text-[15px]">
                  Review and accept new tutoring sessions.
                </p>
              </header>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard
                    title="Daily Limit"
                    value={`${stats.todaysSessions} / ${stats.dailyLimit} Sessions`}
                    icon={Clock}
                    color="primary"
                  />
                  <StatsCard
                    title="Accepted Today"
                    value={stats.todaysSessions}
                    icon={CheckCircle}
                    color="green"
                  />
                  <StatsCard
                    title="Remaining"
                    value={stats.remainingToday}
                    icon={Users}
                    color={stats.remainingToday > 0 ? 'blue' : 'red'}
                  />
                </div>
              )}

              <div className="space-y-4">
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-12 dark-card-container">
                    <p className="text-indigo-200">No incoming requests at the moment.</p>
                  </div>
                ) : (
                  incomingRequests.map((request) => (
                    <RequestCard
                      key={request._id}
                      request={request}
                      type="volunteer"
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'accepted' && (
            <>
              <header className="space-y-2">
                <h1 className="text-[32px] font-bold text-white tracking-tight">Accepted Courses</h1>
                <p className="text-indigo-200 text-[15px]">
                  Manage your ongoing and scheduled sessions.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {acceptedCourses.length === 0 ? (
                  <div className="dark-card-container p-6 text-indigo-200 text-sm">
                    You haven't accepted any requests yet.
                  </div>
                ) : (
                  acceptedCourses.map((request) => (
                    <div
                      key={request._id}
                      className="dark-card-container p-6 flex flex-col gap-4 border-t-4 border-emerald-500/80"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{request.studentName}</p>
                          <p className="text-xs text-indigo-200 flex items-center gap-1">
                            <span>{request.subject}</span>
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-300">
                          {request.status === 'completed' ? 'Completed' : 'Accepted'}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-indigo-200 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                        <span>
                          {new Date(request.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                          })}
                          <span className="mx-1">•</span>
                          {request.timeSlot}
                        </span>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-medium shadow-lg shadow-emerald-500/30"
                        >
                          Mark as Complete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default VolunteerDashboard;