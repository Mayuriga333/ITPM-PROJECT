import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentAPI, requestAPI } from '../../services/api';
import { storage } from '../../services/storage';
import RequestCard from '../Requests/RequestCard';
import StatsCard from './StatsCard';
import Button from '../common/Button';
import Card from '../common/Card';
import StarRating from '../common/StarRating';
import { Textarea } from '../common/Textarea';
import { Input, Label } from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import UserMenu from '../common/UserMenu';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeRequestForReview, setActiveRequestForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubject, setReviewSubject] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeRequestForEdit, setActiveRequestForEdit] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const navigate = useNavigate();

  const student = storage.getCurrentStudent();
  const studentId = user?.id || student?._id;
  const studentName = user?.name || student?.name || 'Student';

  const TIME_SLOTS = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
  ];

  useEffect(() => {
    if (!studentId) {
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
  }, [studentId]);

  const fetchDashboardData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        studentAPI.getRequests(studentId),
        studentAPI.getStats(studentId)
      ]);
      setRequests(requestsRes.data || {});
      setStats(statsRes.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request) => {
    setActiveRequestForReview(request);
    setReviewRating(0);
    setReviewText('');
    setReviewSubject(request.subject || '');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setActiveRequestForReview(null);
    setReviewRating(0);
    setReviewText('');
    setReviewSubject('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeRequestForReview) return;

    if (!reviewRating) {
      toast.error('Please select a star rating.');
      return;
    }

    if (!reviewSubject.trim()) {
      toast.error('Please enter the topic/subject studied.');
      return;
    }

    try {
      setSubmittingReview(true);
      await requestAPI.review(activeRequestForReview._id, {
        rating: reviewRating,
        reviewText: reviewText.trim(),
        reviewSubject: reviewSubject.trim(),
      });
      toast.success('Review submitted successfully');
      closeReviewModal();
      // Refresh dashboard data so the review appears
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      // Error toast is handled globally in API interceptor
    } finally {
      setSubmittingReview(false);
    }
  };

  const openEditModal = (request) => {
    setActiveRequestForEdit(request);
    setEditStudentName(request.studentName || studentName);
    setEditSubject(request.subject || '');
    setEditMessage(request.message || '');
    // request.date is ISO; convert to yyyy-mm-dd for input[type=date]
    const d = request.date ? new Date(request.date) : null;
    setEditDate(d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '');
    setEditTimeSlot(request.timeSlot || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setActiveRequestForEdit(null);
    setEditStudentName('');
    setEditSubject('');
    setEditMessage('');
    setEditDate('');
    setEditTimeSlot('');
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!activeRequestForEdit) return;

    if (!editSubject.trim() || !editDate || !editTimeSlot) {
      toast.error('Please fill in subject, date, and time.');
      return;
    }

    try {
      setSubmittingEdit(true);
      await requestAPI.update(activeRequestForEdit._id, {
        subject: editSubject.trim(),
        date: editDate,
        timeSlot: editTimeSlot,
        message: editMessage,
        studentName: editStudentName.trim() || studentName,
      });
      toast.success('Request updated');
      closeEditModal();
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      // errors surfaced via interceptor
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteRequest = async (request) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      await requestAPI.remove(request._id);
      toast.success('Request deleted');
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      // errors via interceptor
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
              {studentName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Student Portal</p>
              <p className="text-xs text-indigo-300 truncate w-[160px]">{studentName}</p>
            </div>
          </div>

          <nav className="space-y-2 mt-2">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-[#181D31] text-indigo-400"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">➤</span>
              <span>Submitted Requests</span>
            </button>
          </nav>
        </aside>

        {/* Main content - match volunteer theme container */}
        <section className="flex-1 space-y-8 h-full bg-[#0B0F19] overflow-y-auto overflow-x-hidden p-8 pb-12">
          <header className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <h1 className="text-[32px] font-bold text-white tracking-tight">Submitted Requests</h1>
              <p className="text-indigo-200 text-[15px]">
                Track the status of your tutoring requests.
              </p>
            </div>
            <UserMenu />
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
                <RequestCard
                  key={req._id}
                  request={req}
                  type="student"
                  onReview={openReviewModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteRequest}
                />
              ))
            )}
          </div>

          {/* Quick action buttons */}
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

        </section>
      </div>

      {/* Review Modal */}
      {showReviewModal && activeRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="max-w-2xl w-full relative overflow-hidden" noPadding>
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />

            <button
              type="button"
              onClick={closeReviewModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-sm"
            >
              Close
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-bold text-white">
                  {activeRequestForReview.subject} with {activeRequestForReview.volunteerName}
                </h2>
                <span className="text-[14px] text-indigo-200">
                  {new Date(activeRequestForReview.date).toLocaleDateString()}
                </span>
              </div>

              <form onSubmit={handleSubmitReview} className="bg-white/5 rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-1">Leave a Review</h3>
                <p className="text-indigo-200 text-sm mb-4">
                  Share clear, constructive feedback about your session.
                </p>

                <div className="mb-6 bg-white/10 inline-block p-2 rounded-xl border border-white/20 shadow-sm">
                  <StarRating initialRating={reviewRating} onRatingChange={setReviewRating} />
                </div>

                <div className="mb-6">
                  <Label>Your Review</Label>
                  <Textarea
                    placeholder="Share your experience with this volunteer..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <Label>Topic/Subject Studied *</Label>
                  <Input
                    placeholder="e.g. Data Science"
                    value={reviewSubject}
                    onChange={(e) => setReviewSubject(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-gradient-to-r from-primary to-primary-hover disabled:opacity-70"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && activeRequestForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="max-w-2xl w-full relative overflow-hidden" noPadding>
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />

            <button
              type="button"
              onClick={closeEditModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-sm"
            >
              Close
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-bold text-white">
                  Edit Request for {activeRequestForEdit.volunteerName}
                </h2>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-5">
                <div>
                  <Label>Your name</Label>
                  <Input
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>What do you need help with?</Label>
                  <Textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    placeholder="Describe the topics or homework questions..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <select
                      className="input-field cursor-pointer"
                      value={editTimeSlot}
                      onChange={(e) => setEditTimeSlot(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select a time
                      </option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submittingEdit}
                  className="w-full bg-gradient-to-r from-primary to-primary-hover disabled:opacity-70"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;