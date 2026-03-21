import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Users } from 'lucide-react';
import { volunteerAPI, requestAPI } from '../../services/api';
import { storage } from '../../services/storage';
import RequestCard from '../Requests/RequestCard';
import StatsCard from './StatsCard';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../common/StarRating';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'accepted'

  // Use AuthContext user id primarily, fallback to storage
  const volunteerId = user?.id || storage.getCurrentVolunteer()?._id;

  useEffect(() => {
    if (volunteerId) {
      fetchDashboardData();
    }
  }, [volunteerId]);

  const fetchDashboardData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        volunteerAPI.getRequests(volunteerId),
        volunteerAPI.getStats(volunteerId)
      ]);

      // Using requestsRes.data because your API setup returns `{ success: true, count, data: [...] }`
      // and the axios interceptor strips it down to `response.data`
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
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

  const rDate = (request) => {
    if (request.reviewCreatedAt) return new Date(request.reviewCreatedAt);
    if (request.date) return new Date(request.date);
    return new Date(0);
  };

  const reviews = requests
    .filter((r) => typeof r.rating === 'number' && r.rating > 0)
    .sort((a, b) => rDate(b) - rDate(a));

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

              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.3fr] gap-6 mt-4">
                {/* Accepted / Completed sessions */}
                <div className="space-y-4">
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

                {/* Reviews from students */}
                <div className="dark-card-container p-6 flex flex-col gap-4">
                  <h2 className="text-lg font-bold text-white">Recent Reviews</h2>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-indigo-200">You haven't received any reviews yet.</p>
                  ) : (
                    reviews.slice(0, 4).map((review) => (
                      <div
                        key={review._id}
                        className="bg-black/30 rounded-2xl border border-white/5 p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {review.studentName || 'Student'}
                            </p>
                            <p className="text-xs text-indigo-200">
                              {review.reviewSubject || review.subject}
                            </p>
                          </div>
                          <StarRating initialRating={review.rating} readOnly />
                        </div>

                        {review.reviewText && (
                          <p className="text-xs text-slate-200 mt-1">
                            “{review.reviewText}”
                          </p>
                        )}

                        <p className="text-[11px] text-slate-400 mt-1">
                          {new Date(review.reviewCreatedAt || review.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default VolunteerDashboard;